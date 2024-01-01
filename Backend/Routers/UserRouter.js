"use strict";
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const auth = require('../Middleware/auth');
const Users = require('../Models/UserModel');

// * Creating Users
router.post('/create-user', async (req, res) => {
    try {

        const { First_Name, Last_Name, Age, Email, Password } = req.body;
        let text = Age.toString().trim();

        if (text == 0 || text == null || text <= 0) {
            return res.status(401).send({ msg: "The Age should not contain spaces or be negative!" })
        }

        const createdUser = new Users({
            First_Name,
            Last_Name,
            Age: Number(text),
            Email,
            Password
        });
        await createdUser.save();

        console.log(new Date().toLocaleString() + ' ' + 'Creating Users...');
        res.status(201).json({ status: true, message: "Users document created successfully", data: { user: createdUser } });
        console.log(new Date().toLocaleString() + ' ' + 'Create Users Document Successfully!');
    } catch (error) {
        console.error(error);
        res.status(400).json({ message: 'Error creating Users document', error: error.message });
    }
});

// * Login route
router.post('/login', async (req, res) => {
    try {
        const user = await Users.findByCredentials(req.body.Email, req.body.Password);
        const token = await user.generateAuthToken();
        console.log(new Date().toLocaleString() + ' ' + 'logging Users...');
        res.status(201).json({ status: true, message: "User Login Successfully", token });
        console.log(new Date().toLocaleString() + ' ' + 'User login Successfully!');
    } catch (e) {
        console.log(e.message);
        res.status(400).json({ message: 'Error in Login', error: e.message });
    }
});

// * Logout route
// router.post('/logout', auth, async (req, res) => {
//     try {
//         req.user.tokens = req.user.tokens.filter((token) => token.token !== req.token);
//         await req.user.save();

//         res.status(200).json({ message: 'Logout successful' });
//     } catch (e) {
//         console.error(e);
//         res.status(500).json({ message: 'Internal Server Error' });
//     }
// });
router.post("/logout", auth, async (req, res) => {
    try {
        res.cookie("token", "none", {
            expires: new Date(Date.now() + 5 * 1000),
            httpOnly: true,
        });
        res
            .status(200)
            .json({ success: true, message: "User logged out successfully" });
    } catch (error) {
        res.status(500).send();
    }
});

// * Get own user profile
router.get('/my-profile', auth, async (req, res) => {
    try {
        const user = req.user;
        res.status(200).json({ status: true, data: user });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error getting user profile', error: error.message });
    }
});

// * Update own user profile
router.put('/update-my-profile', auth, async (req, res) => {
    try {
        const user = req.user;
        const updates = req.body;

        if (updates.hasOwnProperty('Email')) {
            return res.status(400).json({ status: false, message: 'Email update is not allowed' });
        }

        // Check if the password is being updated
        if (updates.hasOwnProperty('Password')) {
            // Hash the updated password
            updates.Password = await bcrypt.hash(updates.Password, 8);
        }

        // Allowing updates to specific fields
        const allowedUpdates = ['First_Name', 'Last_Name', 'Password', 'Age'];
        const isValidOperation = Object.keys(updates).every(update => allowedUpdates.includes(update));

        if (!isValidOperation) {
            return res.status(400).json({ status: false, message: 'Invalid update fields' });
        }

        const updatedUser = await Users.findByIdAndUpdate(user._id, updates, { new: true });

        if (!updatedUser) {
            return res.status(404).json({ status: false, message: 'User not found' });
        }

        console.log(`User with ID: ${user._id} updated their profile successfully`);
        res.status(200).json({ status: true, message: 'User profile updated successfully', data: updatedUser });
    } catch (error) {
        console.error('Error updating user profile:', error.message);
        res.status(500).json({ status: false, message: 'Error updating user profile', error: error.message });
    }
});

// * Delete own user profile
router.delete('/delete-my-profile', auth, async (req, res) => {
    try {
        const user = req.user;
        const deletedUser = await Users.findByIdAndDelete(user._id);
        if (!deletedUser) {
            console.log(`Users document with ID: ${user._id} not found`);
            return res.status(404).json({ message: `Users document with ID: ${user._id} not found` });
        }

        console.log(`User with ID: ${user._id} deleted their profile successfully`);
        res.status(200).json({ status: true, message: 'User profile deleted successfully', data: deletedUser });
    } catch (error) {
        console.error('Error deleting user profile:', error.message);
        res.status(500).json({ status: false, message: 'Error deleting user profile', error: error.message });
    }
});

module.exports = router;
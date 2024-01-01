const express = require('express');
const router = express.Router();
const auth = require('../Middleware/auth');
const { Task, Category } = require('../Models/TaskModel');
require('dotenv').config();
const nodemailer = require('nodemailer');
const smtpTransport = require('nodemailer-smtp-transport');
const Users = require('../Models/UserModel');

// * Email Transfer Set-up
const transporter = nodemailer.createTransport(
    smtpTransport({
        host: process.env.host,
        port: process.env.port,
        auth: {
            user: process.env.email,
            pass: process.env.pass
        }
    })
);

// * Invite Collaborators
router.post('/invite-collaborator/:taskId', auth, async (req, res) => {
    try {
        const taskId = req.params.taskId;
        const { Email } = req.body;

        const task = await Task.findById(taskId);

        if (!task) {
            return res.status(404).json({ status: false, message: 'Task not found' });
        }

        const invitedUser = await Users.findOne({ Email });      

        if (!invitedUser) {
            return res.status(404).json({ status: false, message: 'User not found' });
        }

        task.collaborators.push(invitedUser._id);
        await task.save();

        const mailOptions = {
            from: process.env.email,
            to: Email,
            subject: 'Task Collaboration Invitation',
            text: `You have been invited to collaborate on a task. ${taskId}`,
        };

        await transporter.sendMail(mailOptions);

        res.status(200).json({ status: true, message: 'Collaborator invited successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ status: false, message: 'Error inviting collaborator', error: error.message });
    }
});

// * Create own tasks
router.post('/create-task', auth, async (req, res) => {
    try {
        // const { Title, Description, Completed, Task_Priority,  collaborators } = req.body;
        const { Title, Description, Completed, Task_Priority, collaborators, Due_Date } = req.body;

        let user = req.user;
        const userID = user._id;

        // const areCategoriesValid = await Category.find({ _id: { $in: Categories } }).countDocuments() === Categories.length;

        // if (!areCategoriesValid) {
        //     return res.status(400).json({ message: 'Invalid category IDs. Please provide valid category IDs.' });
        // }

        const createdTask = new Task({
            Title,
            Description,
            Completed,
            Task_Priority,
            Due_Date,
            // Categories,
            user: userID,
            collaborators: collaborators || [],
        });

        await createdTask.save();

        user.Tasks.push(createdTask._id);
        await user.save();

        console.log(new Date().toLocaleString() + ' ' + 'Creating Task...');
        res.status(201).json({ status: true, message: "Task created successfully", data: { task: createdTask } });
        console.log(new Date().toLocaleString() + ' ' + 'Create Task Successfully!');
    } catch (error) {
        console.error(error);
        res.status(400).json({ message: 'Error creating task', error: error.message });
    }
});

// * Get own tasks (including tasks where the user is a collaborator)
router.get('/my-tasks', auth, async (req, res) => {
    try {
        const user = req.user;
        const tasks = await Task.find({
            $or: [
                { user: user._id },
                { collaborators: user._id }
            ]
        });

        res.status(200).json({ status: true, data: tasks });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error getting user tasks', error: error.message });
    }
});

// * Get tasks with priority low
router.get('/tasks-priority-low', auth, async (req, res) => {
    try {
        const user = req.user;
        const tasksLowPriority = await Task.find({ user: user._id, Task_Priority: 'low' });

        res.status(200).json({ status: true, data: tasksLowPriority });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error getting low priority tasks', error: error.message });
    }
});

// * Get tasks with priority medium
router.get('/tasks-priority-medium', auth, async (req, res) => {
    try {
        const user = req.user;
        const tasksMediumPriority = await Task.find({ user: user._id, Task_Priority: 'medium' });

        res.status(200).json({ status: true, data: tasksMediumPriority });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error getting medium priority tasks', error: error.message });
    }
});

// * Get tasks with priority high
router.get('/tasks-priority-high', auth, async (req, res) => {
    try {
        const user = req.user;
        const tasksHighPriority = await Task.find({ user: user._id, Task_Priority: 'high' });

        res.status(200).json({ status: true, data: tasksHighPriority });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error getting high priority tasks', error: error.message });
    }
});

// * Get completed tasks
router.get('/tasks-completed', auth, async (req, res) => {
    try {
        const user = req.user;
        const completedTasks = await Task.find({ user: user._id, Completed: true });

        res.status(200).json({ status: true, data: completedTasks });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error getting completed tasks', error: error.message });
    }
});

// * Get incomplete tasks
router.get('/tasks-incomplete', auth, async (req, res) => {
    try {
        const user = req.user;
        const incompleteTasks = await Task.find({ user: user._id, Completed: false });

        res.status(200).json({ status: true, data: incompleteTasks });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error getting incomplete tasks', error: error.message });
    }
});

// * Delete a task by ID
router.delete('/delete-task/:taskId', auth, async (req, res) => {
    try {
        const taskId = req.params.taskId;
        const user = req.user;

        const existingTask = await Task.findOne({ _id: taskId, user: user._id });

        if (!existingTask) {
            console.log(`Task with ID: ${taskId} not found or unauthorized`);
            return res.status(404).json({ message: `Task with ID: ${taskId} not found or unauthorized` });
        }

        const deletedTask = await Task.findByIdAndDelete(taskId);

        if (!deletedTask) {
            console.log(`Task with ID: ${taskId} not found`);
            return res.status(404).json({ message: `Task with ID: ${taskId} not found` });
        }

        console.log(`Task with ID: ${taskId} deleted successfully`);
        res.status(200).json({ status: true, message: 'Task deleted successfully', data: deletedTask });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error deleting task', error: error.message });
    }
});

// * Get a task by ID
router.get('/get-task/:taskId', auth, async (req, res) => {
    try {
        const taskId = req.params.taskId;
        const task = await Task.findOne({
            _id: taskId,
            $or: [{ user: req.user._id }, { collaborators: req.user._id }]
        }).populate('Categories');

        if (!task) {
            return res.status(404).json({ message: `Task with ID: ${taskId} not found` });
        }

        res.status(200).json({ status: true, data: task });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error getting task', error: error.message });
    }
});

// * Update a task by ID
router.put('/update-task/:taskId', auth, async (req, res) => {
    try {
        const taskId = req.params.taskId;
        const updates = req.body;

        const allowedUpdates = ['Title', 'Description', 'Due_Date', 'Task_Priority',];
        const isValidOperation = Object.keys(updates).every(update => allowedUpdates.includes(update));

        if (!isValidOperation) {
            return res.status(400).json({ status: false, message: 'Invalid update fields' });
        }
        const task = await Task.findOneAndUpdate(
            {
                _id: taskId,
                $or: [{ user: req.user._id }, { collaborators: req.user._id }]
            },
            { ...updates },
            { new: true }
        );

        if (!task) {
            return res.status(404).json({ status: false, message: 'Task not found' });
        }

        console.log(`Task with ID: ${taskId} updated successfully`);
        res.status(200).json({ status: true, message: 'Task updated successfully', data: task });
    } catch (error) {
        console.error('Error updating task:', error.message);
        res.status(500).json({ status: false, message: 'Error updating task', error: error.message });
    }
});

// * Update task by ID
router.put('/update-task-status/:id', async (req, res) => {
    try {
        const taskId = req.params.id;
        const { Completed } = req.body;

        const updatedTask = await Task.findByIdAndUpdate(
            taskId,
            { Completed },
            { new: true } 
        );

        if (!updatedTask) {
            return res.status(404).json({ message: 'Task not found' });
        }

        res.status(200).json({ message: 'Task updated successfully', data: updatedTask });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error', error: error.message });
    }
});

// * Get categories created by the authenticated user
router.get('/categories', auth, async (req, res) => {
    try {
        const user = req.user;

        const categories = await Category.find({ user: user._id });

        res.status(200).json({ status: true, data: categories });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error getting categories', error: error.message });
    }
});

// * Update a category by ID
router.put('/update-category/:categoryId', auth, async (req, res) => {
    try {
        const categoryId = req.params.categoryId;
        const updates = req.body;

        const category = await Category.findById(categoryId);
        if (!category) {
            return res.status(404).json({ status: false, message: 'Category not found' });
        }

        if (category.user.toString() !== req.user._id.toString()) {
            return res.status(403).json({ status: false, message: 'You do not have permission to update this category' });
        }

        const updatedCategory = await Category.findByIdAndUpdate(categoryId, updates, { new: true });

        if (!updatedCategory) {
            return res.status(404).json({ status: false, message: 'Category not found' });
        }

        console.log(`Category with ID: ${categoryId} updated successfully`);
        res.status(200).json({ status: true, message: 'Category updated successfully', data: updatedCategory });
    } catch (error) {
        console.error('Error updating category:', error.message);
        res.status(500).json({ status: false, message: 'Error updating category', error: error.message });
    }
});

// * Create a category
router.post('/create-category', auth, async (req, res) => {
    try {
        const { name } = req.body;
        let user = req.user;
        const userID = user._id;
        const category = new Category({
            name,
            user: userID
        });
        await category.save();

        user.Categories.push(category._id);
        await user.save();

        console.log(new Date().toLocaleString() + ' ' + 'Creating Category...');
        res.status(201).json({ status: true, message: 'Category created successfully', data: { category } });
        console.log(new Date().toLocaleString() + ' ' + 'Create Category Successfully!');
    } catch (error) {
        console.error(error);
        res.status(400).json({ message: 'Error creating category', error: error.message });
    }
});

// * Delete a category by ID
router.delete('/delete-category/:categoryId', auth, async (req, res) => {
    try {
        const categoryId = req.params.categoryId;

        const deletedCategory = await Category.findOneAndDelete({ _id: categoryId, user: req.user._id });

        if (!deletedCategory) {
            return res.status(404).json({ status: false, message: 'Category not found or you do not have permission to delete it' });
        }

        console.log(`Category with ID: ${categoryId} deleted successfully`);
        res.status(200).json({ status: true, message: 'Category deleted successfully', data: deletedCategory });
    } catch (error) {
        console.error('Error deleting category:', error.message);
        res.status(500).json({ status: false, message: 'Error deleting category', error: error.message });
    }
});

module.exports = router;
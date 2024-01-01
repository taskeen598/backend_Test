const mongoose = require('mongoose');

// * Category Schema
const categorySchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
        unique: true
    },

    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Users',
    }
});

const Category = mongoose.model('Category', categorySchema);

// * Task Schema
const taskSchema = new mongoose.Schema({
    Title: {
        type: String,
        required: true,
        trim: true
    },
    Description: {
        type: String,
        required: true,
        trim: true
    },
    Completed: {
        type: Boolean,
        default: false
    },
    Task_Priority: {
        type: String,
        enum: ['low', 'medium', 'high']
    },
    // Categories: {
    //     type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Category' }],
    //     // required: true,
    //     validate: {
    //         validator: function (categories) {
    //             return categories.length > 0;
    //         },
    //         message: 'At least one category must be selected.'
    //     }
    // },

    Due_Date: {
        type: Date
    },
    collaborators: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Users',
    }],
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Users',
    }
}, {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
});

const Task = mongoose.model('Task', taskSchema);

module.exports = { Task, Category };
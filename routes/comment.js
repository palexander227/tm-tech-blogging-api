const express = require('express');
const router = express.Router()
const Comment = require('../models/comment');
const User = require('../models/user');

// get all comments for the post
router.get('/:postid', async (req, res) => {
    const { postid } = req.params;
    try {
        const comments = await Comment.findAll({ where: { postid: postid }, include: [{model: User, as: 'user'}] });
        res.status(200).send({ message: '', comments })
    }
    catch (err) {
        res.status(500).send({ message: 'Some error occured while fetching comments for logged in user' })
    }
})

// Add comment
router.post('/', async (req, res) => {
    try {
        const comment = await Comment.create({
            content: req.body.content,
            postId: req.body.postId,
            userId: req.user.id
        });

        const comments = await Comment.findByPk(comment.id, {include: [{model: User, as: 'user'}] });
        res.status(201).send({ message: 'Comment created', comment: comments });
    }
    catch (err) {
        if (err.name === 'SequelizeForeignKeyConstraintError')
            res.status(500).send({ message: 'Post ID is invalid' })
        else
            res.status(500).send({ message: 'Error creating comment' })
    }
})

// Update comment
router.put('/:commentid', async (req, res) => {
    const { commentid } = req.params;

    try {
        const comment = await Comment.findByPk(commentid);
        if (comment) {
            comment.content = req.body.content

            await comment.save();
            res.status(200).send({ message: 'Comment updated successfully', comment });
        }
        else {
            res.status(200).send({ message: 'Comment not found' });
        }
    }
    catch (err) {
        res.status(500).send({ message: 'Error updating comment details' })
    }
})

// Delete comment
router.delete('/:commentid', async (req, res) => {
    const { commentid } = req.params;

    try {
        const comment = await Comment.findByPk(commentid);
        if (comment) {
            comment.destroy();
            res.status(200).send({ message: 'Comment deleted successfully' });
        }
        else {
            res.status(200).send({ message: 'Comment not found' });
        }
    }
    catch (err) {
        res.status(500).send({ message: 'Error deleting comment' })
    }
})



module.exports = router
'use strict';

const express = require('express');
const router = express.Router();

const User = require('./models').User;
const Course = require('./models').Course;



router.param("id", function(req, res, next, id) {
        Course.findById(id, function(err, doc){
            if(err) return next();
            if(!doc) {
                err = new Error("Not Found");
                err.status = 404;
                return next(err);
            }
            req.course = doc;
            return next();
        });
    });


// GET /api/users 200 - Returns the currently authenticated user
router.get("/users", (req, res, next) => {
        User.find({}).exec(function(err, users){
                if(err) return next(err);
                    res.json(users);
            });
});



// POST /api/users 201 - Creates a user, sets the Location header to "/", and returns no content
router.post("/users",  (req, res, next) => {
        var user = new User(req.body);
        user.save(function(err, user){
                if(err) return next();
                res.status(201);
                res.location('/');     
        });
});



// GET /api/courses 200 - Returns a list of courses (including the user that owns each course)
router.get("/courses", (req, res, next) => {
        console.log('get courses');
        Course.find({}).exec(function(err, courses){
            if(err) return next(err);
                res.json(courses);
        });

});



// GET /api/courses/:id 200 - Returns a the course (including the user that owns the course) for the provided course ID
router.get("/courses/:id", (req, res, next) => {
    console.log('get specific course');
    Course.findById(req.params.id).exec(function(err, courses){
        if(err) return next(err);
            res.json(courses);
    });
});



// POST /api/courses 201 - Creates a course, sets the Location header to the URI for the course, and returns no content
router.post("/courses", (req, res, next) => {
        var course = new Course(req.body);

        course.validate(function (err, req, res) {
                if (err && err.name === "ValidationError") {
                        err.status = 400;
                        console.log(err);
                        return next(err);
                } 
        });
        course.save(function(err, course){
                if(err) return next();
                res.status(201);
                res.location('/');         
        });
        
});



// PUT /api/courses/:id 204 - Updates a course and returns no content
router.put("/courses/:id", (req, res, next) => {
        let course = req.body;
        // course.validate(function (err, req, res) {
        //         if (err && err.name === "ValidationError") {
        //                 err.status = 400;
        //                 console.log(err);
        //                 return next(err);
        //         } 
        // });
        req.course.updateOne(req.body, function(err,result){
                if (err && err.name === "ValidationError") {
                        err.status = 400;
                        console.log(err);
                        return next(err);
                } else if (err) {
                        return next(err);
                }
        });

});



// DELETE /api/courses/:id 204 - Deletes a course and returns no content
router.delete("/courses/:id", (req, res, next) => {
        req.course.remove();

});



module.exports = router;
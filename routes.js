'use strict';

const express = require('express');
const router = express.Router();
const auth = require('basic-auth');
const bcrypt = require('bcrypt');
const SaltRounds = 10;

const User = require('./models').User;
const Course = require('./models').Course;

function validateEmail(email) {
        var re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
        return re.test(email);
}

// Authenticate User
router.use(function(req, res, next){
    const url = req.originalUrl;
    const method = req.method;
    const urlId = url.slice(13);
    if ((url === "/api/users" && method === "GET") || (url === "/api/courses" && method === "POST") || (url === `/api/courses/${urlId}` && method === "PUT") || (url === `/api/courses/${urlId}` && method === "DELETE")) {
    
        let userNow = auth(req);
        if (userNow) {
                User.findOne({ emailAddress: userNow.name}).exec(function(err, user) {
                        if(user) {
                                bcrypt.compare(userNow.pass, user.password, function(err, res){
                                        if(res) {
                                                req.user = user;
                                                next();
                                        } else {
                                                const error = new Error("Password not valid");
                                                error.status = 401;
                                                next(error);
                                        }
                                });     
                        }    else {
                                const error = new Error("User not valid");
                                error.status = 401;
                                next(error); 
                        }                
                });
        } else {
            const error = new Error("No User supplied");
            error.status = 401;
            next(error);
        }
    } else {
        next();
    }
});



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
                res.json(req.user);
            });
});



// POST /api/users 201 - Creates a user, sets the Location header to "/", and returns no content
router.post("/users",  (req, res, next) => {
        let email = req.body.emailAddress;
        if(!email){
                const error = new Error("Email required");
                        error.status = 400;
                        next(error); 
        } else {
                User.find({emailAddress: req.body.emailAddress}, function(err,users){
                        if (users.length !==0) {
                                const error = new Error("Email already exists");
                                error.status = 400;
                                next(error); 
                        } else if (!validateEmail(req.body.emailAddress)) {
                                const error = new Error("Email not valid");
                                        error.status = 400;
                                        next(error); 
                        } else {
                                var user = new User(req.body);
                                user.validate(function (err, req, res) {
                                        if (err && err.name === "ValidationError") {
                                                err.status = 400;
                                                return next(err);
                                        } 
                                });
                                user.save(function(err, user){
                                        if(err) return next();
                                        res.location('/');                   
                                        res.sendStatus(201);  
                                });
                        }
                });
        }
});



// GET /api/courses 200 - Returns a list of courses (including the user that owns each course)
router.get("/courses", (req, res, next) => {
        Course.find({}).populate('user', 'firstName lastName').select({"title": 1, "user":1}).exec(function(err, courses){
            if(err) return next(err);
                res.status(200);
                res.json(courses);
        });

});



// GET /api/courses/:id 200 - Returns a the course (including the user that owns the course) for the provided course ID
router.get("/courses/:id", (req, res, next) => {
    Course.findById(req.params.id).populate('user', 'firstName lastName').exec(function(err, courses){
        if(err) return next(err);
            res.json(courses);
    });
});



// POST /api/courses 201 - Creates a course, sets the Location header to the URI for the course, and returns no content
router.post("/courses", (req, res, next) => {
        if(!req.user){
                const error = new Error("Authorized user must be signed in.");
                                error.status = 401;
                                next(error); 
        } else {
                var course = new Course({...req.body, user: req.user._id});
        
                course.validate(function (err, req, res) {
                        if (err && err.name === "ValidationError") {
                                err.status = 400;
                                return next(err);
                        } 
                });
                course.save(function(err, course){
                        if(err) return next();
                        res.location('/'); 
                        res.sendStatus(201);       
                });
        }
        
});



// PUT /api/courses/:id 204 - Updates a course and returns no content
router.put("/courses/:id", (req, res, next) => {
        if(req.course.user.toString() === req.user._id.toString()) {
                req.course.updateOne(req.body, {upsert: true, runValidators: true}, function(err,result){
                        if (err && err.name === "ValidationError") {
                                err.status = 400;
                                return next(err);
                        } else if (err) {
                                return next(err);
                        } else {
                                res.sendStatus(204);
                        }
                });
        } else {
                const error = new Error("Changes can only be made by course's user");
                        error.status = 403;
                        next(error); 
        }

});



// DELETE /api/courses/:id 204 - Deletes a course and returns no content
router.delete("/courses/:id", (req, res, next) => {
        if(req.course.user.toString() === req.user._id.toString()) {
                req.course.remove();
                res.sendStatus(204);
        } else {
                const error = new Error("Changes can only be made by course's user");
                        error.status = 403;
                        next(error); 
        }

});



module.exports = router;
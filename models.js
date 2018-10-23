'use strict';

const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const SaltRounds = 10;
const Schema = mongoose.Schema;

const UserSchema = new Schema({
    firstName: {type: String, required: [true, "First name is required"]},
    lastName: {type: String, required: [true, "Last name is required"]},
    emailAddress: {type: String, required: [true, "Email address is required"]},
    password: {type: String, required: [true, "Password is required"]}
});

const CourseSchema = new Schema({
    user: {type: mongoose.Schema.Types.ObjectId, ref: 'User'}, //id from users collection
    title: {type: String, required: [true, "Title is required"]},
    description: {type: String, required: [true, "Description is required"]},
    estimatedTime: String,
    materialsNeeded: String
});

UserSchema.pre('save', function(next) {
    var user = this;
    bcrypt.genSalt(SaltRounds, function(err, salt) {
        if (err) return next(err);

        bcrypt.hash(user.password, salt, function(err, hash) {
            if (err) return next(err);
            user.password = hash;
            next();
        });
    });
});

CourseSchema.pre('save', function(next){
    course.validate(function (err, req, res) {
        if (err && err.name === "ValidationError") {
                err.status = 400;
                console.log(err);
                return next(err);
        } 
    });
});

const User = mongoose.model("User", UserSchema);
const Course = mongoose.model("Course", CourseSchema);


module.exports.User = User;
module.exports.Course = Course;
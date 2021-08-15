
const uuid=require('uuid')
const jwt=require('jsonwebtoken')
const User=require('../database/models/user')
const bcrypt=require('bcryptjs')
const {combineResolvers}=require('graphql-resolvers')
const {tasks,users}=require('../constants')
const { isAuthenticated } = require('./middleware')
const Task = require('../database/models/task')
const PubSub=require('../subscription')
const { userEvents } = require('../subscription/events')
userEvents
module.exports={
    Query:{
        user:combineResolvers(isAuthenticated,async (_,arg,{id})=>{
         try {
           const user=await User.findById(id)
           return user
         } catch (error) {
           console.log(error);
           throw error
         }
        })
    },

    Mutation:{ 
       signup:async (_,{input})=>{
         try {
            const user=await User.findOne({email:input.email})
            if(user){
              throw new Error('Email already exists')
            }
            const hashedPassword=await bcrypt.hash(input.password,12)
            const newUser=new User({...input,password:hashedPassword})
            const result=await newUser.save()
            PubSub.publish(userEvents.USER_CREATED,{
              userCreated:result
            })
            return result
         } catch (error) {
             console.log(error);
             throw error
         }
       } ,

       login:async (_,{input})=>{
         try {
          const {email,password}=input 
          const userExist=await User.findOne({email})
          if(userExist){
           const isPasswordValid=await bcrypt.compare(password,userExist.password)
           if(!isPasswordValid){
             throw new Error('passwoed is incorrect')
           }
           const token=jwt.sign({id:userExist._id},process.env.SECRET,{
             expiresIn:'1d'
           })
           return {token}
          }else{
            throw new Error('Invalid credentials')
          }
         } catch (error) {
           console.log(error);
           throw error
         }
       }
    },

    Subscription:{
       userCreated:{
         subscribe:()=>PubSub.asyncIterator(userEvents.USER_CREATED)
       }
    },
    User:{
     tasks:async({id})=>{
       try {
        const tasks=await Task.find({user:id})
        return tasks
       } catch (error) {
         console.log(error);
         throw error
       }
     }
    }
}
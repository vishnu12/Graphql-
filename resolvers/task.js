const Task = require('../database/models/task')
const User = require('../database/models/user')
const { isAuthenticated, isTaskOwner } = require('./middleware')
const { combineResolvers } = require('graphql-resolvers')
const { stringToBase64,base64ToString } = require('../helper')
const PubSub=require('../subscription')
const {taskEvents}=require('../subscription/events')

module.exports = {

    Query: {
        tasks: combineResolvers(isAuthenticated, async (_, { cursor, limit = 10 }, { id }) => {
            try {
                const query={ user: id }
                if(cursor){
                    query['_id']={
                        '$lt':base64ToString(cursor)
                    }
                }
                let tasks = await Task.find(query)
                    .sort({ _id: -1 })
                    .limit(limit+1)
                const hasNextPage=tasks.length>limit
                tasks=hasNextPage?tasks.slice(0,-1):tasks
                return {
                    taskFeed:tasks,
                    pageInfo:{
                        nextPageCursor:hasNextPage?stringToBase64(tasks[tasks.length-1]._id):null,
                        hasNextPage
                    }
                }
            } catch (error) {
                console.log(error);
                throw error
            }
        }),
        task: combineResolvers(isAuthenticated, isTaskOwner, async (_, arg, { id }) => {
            try {
                const task = await Task.findById(arg.id)
                return task
            } catch (error) {
                console.log(error);
                throw error
            }
        }),
    },

    Mutation: {
        createTask: combineResolvers(isAuthenticated, async (_, { input }, { id }) => {
            try {
                const user = await User.findById(id)
                const task = new Task({ ...input, user: id })
                const createdTask = await task.save()
                PubSub.publish(taskEvents.TASK_CREATED,{
                    taskCreated:createdTask
                })
                user.tasks.push(createdTask._id)
                await user.save()
                return createdTask
            } catch (error) {
                console.log(error);
                throw error
            }

        }),

        updateTask: combineResolvers(isAuthenticated, isTaskOwner, async (_, { id, input }, { id: userId }) => {
            try {
                const task = await Task.findByIdAndUpdate(id, { ...input }, { new: true })
                return task
            } catch (error) {
                console.log(error);
                throw error
            }
        }),
        deleteTask: combineResolvers(isAuthenticated, isTaskOwner, async (_, { id: taskId }, { id: loggedInUserId }) => {
            try {
                const delTask = await Task.findByIdAndDelete(taskId)
                await User.updateOne({ _id: loggedInUserId }, { $pull: { tasks: taskId } })
                return delTask
            } catch (error) {
                console.log(error);
                throw error
            }
        })
    },

    Subscription:{
       taskCreated:{
           subscribe:()=>PubSub.asyncIterator(taskEvents.TASK_CREATED)
       }
    },

    Task: {
        //arg is parent
        user: async (parent,_,{loaders}) => {
            try {
                // const user = await User.findById(parent.user)
                const user=await loaders.user.load(parent.user.toString())
                return user
            } catch (error) {
                console.log(error);
                throw error
            }
        }
    },


}
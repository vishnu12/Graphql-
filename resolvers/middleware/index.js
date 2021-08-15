
const {skip}=require('graphql-resolvers')
const Task=require('../../database/models/task')
const { isValidObjectId } = require('../../database/utils')


module.exports.isAuthenticated=(_,_a,{id})=>{
   if(!id){
       throw new Error('Authentication failed, Please login again')
   }

   return skip
}


module.exports.isTaskOwner=async(_,{id:taskId},{id:userId})=>{
   try {
     if(!isValidObjectId(taskId)){
       throw new Error('Invalid task id')
     }  
    const task=await Task.findById(taskId)
    if(!task){
        throw new Error('Task not found')
    }else if(task.user.toString()!==userId){
        throw new Error('Permission denied')
    }
    return skip
   } catch (error) {
       console.log(error);
       throw error
   }

  
}
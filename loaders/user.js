
const User=require('../database/models/user')

module.exports.batchUsers=async (userIds)=>{
   console.log('keys====',userIds)
   const users=await User.find({_id:{$in:userIds}})
   return userIds.map(id=>users.find(user=>user._id==id))
}
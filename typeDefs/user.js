
const {gql}=require('apollo-server-express')
module.exports=gql`
  extend type Query{
      user:User
  }


  extend type Mutation{
    signup(input:signupInput):User
    login(input:loginInput):Token
  }

  type Token{
    token:String!
  }

  input loginInput{
    email:String!
    password:String!
  }

  input signupInput{
   name:String!
   email:String!
   password:String!
  }


  type User{
      id:ID!
      name:String!
      email:String!
      tasks:[Task!] 
      createdAt:Date!
      updatedAt:Date!
  }

  extend type Subscription{
    userCreated:User
  }

`
const express = require('express')
const {createServer}=require('http')
const {ApolloServer} = require('apollo-server-express')
const { execute, subscribe } =require("graphql") 
const { SubscriptionServer } =require("subscriptions-transport-ws") 
const { makeExecutableSchema } =require("@graphql-tools/schema") 
const cors = require('cors')
const  dotenv = require('dotenv')
const DataLoader=require('dataloader')
const resolvers=require('./resolvers')
const typeDefs=require('./typeDefs')
const {connection}=require('./database/utils')
const {verifyUser}=require('./helper/context')
const loaders = require('./loaders')


dotenv.config()

const app=express()
app.use(express.json())

app.use(cors())

const httpServer=createServer(app)

connection()
const schema = makeExecutableSchema({
    typeDefs,
    resolvers,
  });
const apolloServer=new ApolloServer({
    schema,
    context:async ({req})=>{
        const contextObj={}
        if(req){
        await verifyUser(req)
        contextObj.id=req.user
        }
        contextObj.loaders={
            user:new DataLoader(keys=>loaders.user.batchUsers(keys))
        }
        return contextObj
    },
    
})


apolloServer.start().then(()=>{
 apolloServer.applyMiddleware({app,path:'/graphql'})
})

SubscriptionServer.create(
    { schema, execute, subscribe },
    { server: httpServer, path: apolloServer.graphqlPath }
  );


const port=process.env.PORT || 3000

httpServer.listen(port,()=>{
    console.log(`Server is  running on port ${port}`)
    console.log(`Graphql is  running on path ${apolloServer.graphqlPath}`)
})


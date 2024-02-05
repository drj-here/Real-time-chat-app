// this is the entry point for our app

const path=require('path')
const express=require('express')
const http=require('http')
const app=express();
const socketio=require('socket.io')
const formatMessages=require('./utils/messages')
const {joinUser,getCurrentUser,userLeave,getRoomUsers}=require('./utils/users')


//server creation using http as websocket server needs a raw http server , not the one created by express
const server=http.createServer(app);

const admin='admin';

const io=socketio(server)

//set static folder
app.use(express.static(path.join(__dirname,'public')));

// io.on() used on the server side to listen for the incoming connection

io.on('connection',socket=>{
    // console.log('new web socket connection')
    
    socket.on('joinRoom',({username,room})=>{

        const user=joinUser(socket.id,username,room);

        socket.join(user.room);
        // only to the client who has joined
    socket.emit('message',formatMessages(admin,'Welcome to ChatCord!'))

    // broadcast
    socket.broadcast.to(user.room).emit('message',formatMessages(admin,`${user.username} has joined`))

    // send users n room info
    io.to(user.room).emit('roomUsers',{
        room:user.room,
        username:user.username,
        users:getRoomUsers(user.room)
    })
    })

    
// socket.on is used on both the client and server sides to listen for custom events

    // receive chatMessage
    socket.on('chatMessage',msg=>{
        const user=getCurrentUser(socket.id)
        io.to(user.room).emit('message',formatMessages(user.username,msg))
    })

    //  runs when a user leaves
     socket.on('disconnect',()=>{
        const user=userLeave(socket.id)
        if(user){
        io.to(user.room).emit('message',formatMessages(admin,`${user.username} has left the chat`))

        io.to(user.room).emit('roomUsers',{
            room:user.room,
            username:user.username,
            users:getRoomUsers(user.room)
        })}
    })

})

const PORT=3000 || process.env.PORT;

server.listen(PORT,()=>console.log(`server started on port ${PORT}`))
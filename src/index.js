
const http = require('http');
const express = require('express');
const path = require('path');
const socketio = require('socket.io');
const Filter = require('bad-words');
const { generateMessage, generateLocationMessage } = require('./utils/messages');
const { 
  addUser,
  removeUser,
  getUser,
  getUsersInRoom
} = require('./utils/users');

/* Express creates the server behind the scenes which we don't have access to. Instead create a http server passing the express app to it and then pass on that server as an argument to the socketio function */
const app = express();
const server = http.createServer(app);
const io = socketio(server);

const port = process.env.PORT || 3000;
const publicDirPath =  path.join(__dirname, '../public');

app.use(express.static(publicDirPath));

let count = 0;

// server (emit) -> client (receive) - countUpdated event
// client (emit) -> server (receive) - increment event

// socket.io listens to an in-built connection event to occur. Call scripts from client side (browser) to connect to the server. Each client has its own socket.io.connection
io.on('connection', (socket) => {
  // With this message, it shows our server has setup the websocket correctly and that the client can communicate to the server via websocket
  console.log('New Websocket connection');

  // // Send data back to newly connected client
  // socket.emit('message', generateMessage('Welcome!'));
  
  // // Send message to all connections except the current one
  // socket.broadcast.emit('message', generateMessage('A new user has joined'));

  socket.on('join', (options, callback) => {
    const { error, user } = addUser({ id: socket.id, ...options });

    if(error) {
      return callback(error);
    }

    socket.join(user.room);

    socket.emit('message', generateMessage('Welcome!', 'Admin'));
    socket.broadcast.to(user.room).emit('message', generateMessage(`${user.username} has joined!`, 'Admin'));

    // Send all room participants data to chat.js
    io.to(user.room).emit('roomData', {
      room: user.room,
      users: getUsersInRoom(user.room)
    });

    callback();
  });

  socket.on('sendMessage', (message, callback)  => {
    const user = getUser(socket.id);

    if(!user) {
      return callback('User not found!', 'Admin');
    }

    // Check for profanity or bad words in the received message
    const filter = new Filter();
    const newBadWords = ['madarchod', 'bhenchod', 'gandu'];

    filter.addWords(...newBadWords);

    if(filter.isProfane(message)) {
      return callback('Profanity is not allowed!', 'Admin');
    }

    // io.emit sends data to every connection connected to this server, whereas socket.emit() just sends the data to the one particular connection
    io.to(user.room).emit('message', generateMessage(message, user.username));

    // Send acknowledgement to the client by executing the callback registered with the client's emit method
    callback();
  });

  socket.on('sendLocation', (coordinates, callback) => {
    if(!coordinates) {
      return callback('No location received!', 'Admin');
    }

    const user = getUser(socket.id);

    if(!user) {
      return callback('User not found!');
    }

    io.to(user.room).emit('locationMessage', generateLocationMessage(`https://google.com/maps?q=${coordinates.latitude},${coordinates.longitude}`, user.username));
    callback();
  });

  // Call built-in event when a client disconnects.
  socket.on('disconnect', () => {
    const user = removeUser(socket.id);

    if(user) {
      io.to(user.room).emit('message', generateMessage(`${user.username} has left!`, 'Admin'));

      // Send room users data to refresh the participants list on the client UI
      io.to(user.room).emit('roomData', {
        room: user.room,
        users: getUsersInRoom(user.room)
      });
    }
  });

});



server.listen(port, () => {
  console.log(`Server listening on port ${port}!`);
}); 
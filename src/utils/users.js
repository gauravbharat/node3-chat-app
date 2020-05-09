// Keep a track on the users
const users = [];

// addUser, removeUser, getUser, getUsersInRoom

const addUser = ({ id, username, room } = {}) => {
  // Clean the data
  username = username.trim().toLowerCase();
  room = room.trim().toLowerCase();

  // Validate the data
  if(!username || !room) {
    return {
      error: 'Username and room are required!'
    }
  }

  // Check for existing user
  const existingUser = users.find(user => user.room === room && user.username === username );

  // Validate username
  if(existingUser) {
    return {
      error: 'Username is in use!'
    }
  }

  // Store user
  const user = { id, username, room };
  users.push(user);
  return { user };

};

const removeUser = id => {
  const index = users.findIndex(user => user.id === id);

  if (index !== -1) {
    // Splice removes the user and returns an array of the removed record
    // Return the removed user array
    return users.splice(index, 1)[0];
  }
};

const getUser = id => users.find(user => user.id === id);
const getUsersInRoom = room => users.filter(user => user.room === room);

module.exports = {
  addUser,
  removeUser,
  getUser,
  getUsersInRoom
};


// console.log(addUser({
//   id: 22,
//   username: 'Gary  ',
//   room: '    South Philly '
// }));

// console.log(addUser({
//   id: 24,
//   username: 'Larry  ',
//   room: '    South Philly '
// }));

// console.log(addUser({
//   id: 33,
//   username: 'Balli  ',
//   room: '    South Bali '
// }));

// console.log(getUser(22));
// console.log(getUser(23)); //should return undefined

// console.log(getUsersInRoom('south philly'));
// console.log(getUsersInRoom('south bali'));
// console.log(getUsersInRoom('south dally')); //should return an empty array


// console.log(removeUser(22));
// console.log(removeUser(24));
// console.log(removeUser(33));
// console.log(users); //should return an empty array

// Initialize connection and access the socket
const socket = io();

// Elements, using $ sign prefix to identify stored DOM elements
const $messageForm = document.querySelector('#message-form');
const $messageFormInput = $messageForm.querySelector('input');
const $messageFormButton = $messageForm.querySelector('button');
const $sendLocationButton = document.querySelector('#send-location');
const $messages = document.querySelector('#messages');
const $sidebar = document.querySelector('#sidebar');
// const $joinForm = document.querySelector('#join-form');

// Templates
const messageTemplate = document.querySelector('#message-template').innerHTML;
const messageLocationTemplate = document.querySelector('#message-location-template').innerHTML;
const sidebarTemplate = document.querySelector('#sidebar-template').innerHTML;

// Options - Use QueryString qs.js to parse location.search (name and chat room fiels)
const { username, room } = Qs.parse(location.search, { ignoreQueryPrefix: true });

const autoscroll = () => {
  // New message element
  const $newMessage = $messages.lastElementChild;

  // Height of the new message
  const newMessageStyles = getComputedStyle($newMessage); //Returns CSS styles
  const newMessageMargin = parseInt(newMessageStyles.marginBottom); //Get the margin
  const newMessageHeight = $newMessage.offsetHeight + newMessageMargin; //Add to offset height

  // Visible height
  const visibleHeight = $messages.offsetHeight;

  // Height of messages container
  const containerHeight = $messages.scrollHeight;

  // How far have I scrolled?
  const scrollOffset = $messages.scrollTop + visibleHeight;

  // Only scroll if the user is at the bottom
  if(containerHeight - newMessageHeight <= scrollOffset) {
    $messages.scrollTop = $messages.scrollHeight;
  }
};

///////////////////////////////////////////////////////////
// Handling custom events
socket.on('message', message => {
  // console.log(message);
  /* Using MUSTACHE templating inside a client browser instead of using it as an npm package in the nodejs, that is on the server side 
    Use Moment.js to convert createdAt timestamp to convert it to a human readable time */
  const html = Mustache.render(messageTemplate, {
    text: message.text,
    createdAt: moment(message.createdAt).format('h:mm a'),
    username: message.username
  });
  $messages.insertAdjacentHTML('beforeend', html);
  autoscroll();
});

socket.on('locationMessage', url => {
  const html = Mustache.render(messageLocationTemplate, {
    url,
    createdAt: moment(url.createdAt).format('h:mm a'),
    username: url.username
  }); 
  $messages.insertAdjacentHTML('beforeend', html);
  autoscroll();
});

socket.on('roomData', ({ room, users } = {}) => {
  const html = Mustache.render(sidebarTemplate, {
    room,
    users
  });

  $sidebar.innerHTML = html;
});

socket.emit('join', { username, room }, error => {
  if(error) {
    console.log(error);
    alert(error);
    location.href = '/';
  }
});

///////////////////////////////////////////////////////////
// DOM event listeners
$messageForm.addEventListener('submit', e => {
  e.preventDefault();

  $messageFormButton.setAttribute('disabled', 'disabled');
  $messageFormButton.innerHTML = 'Processing...';

  // const message = e.target.elements.message.value;
  const message = $messageFormInput.value;

  // Use the callback function as the third argument and do action. This function shall trigger on server acknowledgement
  socket.emit('sendMessage', message, (error) => {
    $messageFormButton.removeAttribute('disabled');
    $messageFormButton.innerHTML = 'Send';
    $messageFormInput.value = '';
    $messageFormInput.focus();

    if(error) {
      return console.log(error);
    } else {
      console.log('The message was delivered!');
    }
  });

});

$sendLocationButton.addEventListener('click', () => {
  if(!navigator.geolocation) {
    return console.log('Geolocation is not supported by your browser.');
  }

  $sendLocationButton.setAttribute('disabled', 'disabled');
  $sendLocationButton.innerHTML = 'Processing...';

  navigator.geolocation.getCurrentPosition((pos) => {
    const latitude = pos.coords.latitude;
    const longitude = pos.coords.longitude;

    socket.emit('sendLocation', {
      latitude,
      longitude
    }, (error) => {
      if(error) {
        console.log(error);
      } else {
        console.log('Location shared!');
      }
    });
   
    $sendLocationButton.removeAttribute('disabled');
    $sendLocationButton.innerHTML = 'Send Location';
  });
});



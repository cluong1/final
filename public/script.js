document.addEventListener("DOMContentLoaded", function() {
    const registerAccountForm = document.getElementById("accountSubmissionForm");
    const loginAccountForm = document.getElementById("accountLoginForm");
    const sendFriendForm = document.getElementById("sendFriendForm");
    const sendMessageForm = document.getElementById("sendMessageForm");
    const refreshRequestButton = document.getElementById("refreshRequests");
    const dropdown = document.getElementById('friendsDropdown');
    const refreshFriendsButton = document.getElementById("refreshFriends");
    const chatWindow = document.getElementById("chatWindow");

    if(dropdown){

        loadFriends();
        loadPendingRequests();
        dropdown.addEventListener('change',loadChatHistory);
    }

    if(refreshFriendsButton){
        refreshFriendsButton.addEventListener("click",function() {
            loadFriends();
        });
    }
    async function loadChatHistory() {
        const friend = document.getElementById("friendsDropdown").value;
        const chatWindow = document.getElementById("chatWindow");
    
        if (!friend) {
            return; 
        }
    
        chatWindow.innerHTML = "";
    
        const response = await fetch(`/chat-history?friend=${friend}`, { method: 'GET' });
    
        if (response.ok) {
            const messages = await response.json();
    
            messages.forEach(message => {
                const messageElement = document.createElement('div');
                messageElement.textContent = `${message.from}: ${message.message}`;
                chatWindow.appendChild(messageElement);
            });

            chatWindow.scrollTo=chatWindow.scrollHeight;
        } else {
            console.error('Failed to load chat history');
        }
    }

    async function loadFriends() {
        console.log('Loading friends...');
        const dropdown = document.getElementById("friendsDropdown");
        if(!dropdown){
            console.error('friends dropdown not found');
            return;
        }
        dropdown.innerHTML="";

        try {
            const response = await fetch('/friends', {
                method: 'GET',
            });
    
            if (response.ok) {
                const friends = await response.json();
                console.log(friends);

                friends.forEach(friend => {
                    const option = document.createElement('option');
                    option.value = friend;
                    option.textContent = friend;
                    dropdown.appendChild(option);
                });

                if(friends.length > 0) {
                    dropdown.value = friends[0];
                    loadChatHistory();
                }
            } else {
                console.error('Failed to load friends');
            }

        }catch (err) {
            console.error('Error loading friends:', err);
        }
    }
    

        async function loadPendingRequests() {
            const pendingList = document.getElementById('pendingRequests');
            pendingList.innerHTML = '';
    
            const response = await fetch('/pending-requests', {method: 'GET'});
    
            if(response.ok) {
                const requests = await response.json();
    
                requests.forEach(fromUsername=> {
                    const li = document.createElement('li');
                    li.textContent=fromUsername;
    
                    const acceptButton = document.createElement('button');
    
                    acceptButton.textContent='Accept';
                    acceptButton.onclick = function(){
                        acceptFriendRequest(fromUsername);
                    };
    
                    li.appendChild(acceptButton);
                    pendingList.appendChild(li);
                    /*
                    const denyButton = document.createElement('button');
                    denyButton.textContent = 'Deny';
                    denyButton.style.marginLeft='10px';
                    denyButton.onclick=function(){
                        denyFriendRequest(fromUsername);
                    };
                    li.appendChild(denyButton);
                    */
                });
            } else{
                console.error('Failed to load pending requests');
            }
    }
/*
    async function denyFriendRequest(fromUsername){
        const confirmed = confirm(`Are you sure you want to deny the friend request from ${fromUsername}?`);
        if (!confirmed) return;

        console.log('Confirmed Deny');
        await fetch('/deny-friend-request', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
                fromUsername: fromUsername
            }),
        })
        .then(response => {
            if (response.ok) {
                alert('Friend request denied.');
                loadPendingRequests(); // Refresh list
            } else {
                alert('Failed to deny request.');
            }
        });

    }
    */
    
    //loadPendingRequests();



    async function acceptFriendRequest(fromUsername) {
        await fetch('/accept-friend-request', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
                fromUsername: fromUsername
            }),
        })
        .then(response => {
            if (response.ok) {
                alert('Friend request accepted!');
                loadFriends(); 
            } else {
                alert('Failed to accept request.');
            }
        });
    }

    

    if(sendFriendForm) {
        sendFriendForm.addEventListener("submit", async function(event) {
            event.preventDefault();
            const friendUsername=document.getElementById("friendUsername").value;
            
            await fetch('/send-friend-request', {
                method: 'POST',
                headers: {'Content-Type': 'application/x-www-form-urlencoded'},
                body: new URLSearchParams({
                    friend: friendUsername
                }),
            })
            .then(response=> {
                if(response.ok){
                    alert('Friend request sent.');
                    loadFriends();
                } else{
                    alert("Failed to send friend request.");
                }
            });
        });
    }



    if(sendMessageForm){
        sendMessageForm.addEventListener("submit", async function(event) {
            event.preventDefault();
            const message = document.getElementById("chatMessage").value;
            const selectedFriend = document.getElementById("friendsDropdown").value;

            await fetch('/send-message', {
                method:'POST',
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded"
                },
                body: new URLSearchParams({
                    to: selectedFriend,
                    message: message,
                }),
            })
            .then(response=>{
                if(response.ok){
                    //alert('Message sent!');
                    document.getElementById('chatMessage').value='';

                    const chatWindow = document.getElementById("chatWindow");
                    const messageElement = document.createElement('div');
                    messageElement.textContent = `You: ${message}`;
                    chatWindow.appendChild(messageElement);
                } else{
                    alert('Failed to send message.');
                }
            });
        });
    }

    

    if(registerAccountForm){
        registerAccountForm.addEventListener("submit", async function(event) {
            event.preventDefault();
    
            const user = document.getElementById("createUsername").value;
            const pass = document.getElementById("createPassword").value;

            if (!user || !pass) {
                alert("Please fill in both username and password.");
                return;
            }
    
            fetch("/register", {
                method: "POST",
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded",
                },
                body: new URLSearchParams({
                    username: user,
                    password: pass,
                }),
            })
            .then(response => {
                if (response.redirected) {
                    alert("Registration successful! Redirecting...");
                    window.location.href = response.url;
                }
              });
            })
    }

    
    if(loginAccountForm){
        loginAccountForm.addEventListener("submit",async function(event) {
            event.preventDefault();
    
            const user = document.getElementById("loginUsername").value;
            const pass = document.getElementById("loginPassword").value;

            if (!user || !pass) {
                alert("Please fill in both username and password.");
                return;
            }
    
            const response= await fetch("/login", {
                method: "POST",
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded",
                },
                body: new URLSearchParams({
                    username: user,
                    password: pass,
                }),
            })
            .then(response => {
                if (response.redirected) {
                    //alert("Login successful! Redirecting...");
                    try {
                        window.location.href = response.url;
                        loadFriends(); 
                        loadPendingRequests();
                        loadChatHistory();
                        
                    } catch (err) {
                        console.error("Error loading data before redirect:", err);
                        window.location.href = response.url;
                    }
                }else if(!response.ok){
                    alert("login failed.");
                }
              });
            });
    }

    if(refreshRequestButton){
        refreshRequestButton.addEventListener("click", function() {
            loadPendingRequests();
        });
    }

    //loadFriends();

    const friendsDropdown = document.getElementById("friendsDropdown");
    if(friendsDropdown){
        friendsDropdown.addEventListener('change',loadChatHistory);
    }
});

    
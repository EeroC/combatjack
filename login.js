function login() {
    alert('No ei todellakaan oo vielä mitään tälläsiä täällä. Mene himaas.');
}

function handleLogin(event) {
    event.preventDefault();
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    console.log(`Username: ${username}, Password: ${password}`);
    alert('Usko nyt saatana, ei toimi.');
}
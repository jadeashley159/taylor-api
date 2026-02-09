const API = "https://taylor-api-dftn.onrender.com/api/songs";
let currentPage = 1;

function showList(page = 1) {
    currentPage = page;
    fetch(`${API}/songs?page=${page}`)
        .then(res => res.json())
        .then(data => {
            const content = document.getElementById("content");
            content.innerHTML = "";

            data.songs.forEach(song => {
                const div = document.createElement("div");
                div.className = "song-card";
                div.innerHTML = `
                    <strong>${song.title}</strong><br>
                    Album: ${song.album}<br>
                    Rating: ${song.rating}<br>
                    <button onclick="editSong(${song.id})">Edit</button>
                    <button onclick="deleteSong(${song.id})">Delete</button>
                `;
                content.appendChild(div);
            });

            const paging = document.createElement("div");
            paging.innerHTML = `
                <button ${data.page === 1 ? "disabled" : ""} onclick="showList(${data.page - 1})">Previous</button>
                Page ${data.page} of ${data.totalPages}
                <button ${data.page === data.totalPages ? "disabled" : ""} onclick="showList(${data.page + 1})">Next</button>
            `;
            content.appendChild(paging);
        });
}

function showAddForm() {
    const content = document.getElementById("content");
    content.innerHTML = `
        <h2>Add Song</h2>
        <input id="title" placeholder="Title">
        <input id="album" placeholder="Album">
        <input id="rating" type="number" min="1" max="10" placeholder="Rating (1-10)">
        <button onclick="addSong()">Submit</button>
    `;
}

function addSong() {
    const title = document.getElementById("title").value;
    const album = document.getElementById("album").value;
    const rating = document.getElementById("rating").value;

    if (!title || !album || !rating) {
        alert("All fields required.");
        return;
    }

    fetch(`${API}/songs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, album, rating })
    })
    .then(res => {
        if (!res.ok) throw new Error("Invalid data");
        return res.json();
    })
    .then(() => showList(currentPage))
    .catch(() => alert("Server validation failed."));
}

function deleteSong(id) {
    if (!confirm("Are you sure you want to delete this song?")) return;

    fetch(`${API}/songs/${id}`, {
        method: "DELETE"
    }).then(() => showList(currentPage));
}

function editSong(id) {
    fetch(`${API}/songs?page=${currentPage}`)
        .then(res => res.json())
        .then(data => {
            const song = data.songs.find(s => s.id === id);
            if (!song) return;

            const content = document.getElementById("content");
            content.innerHTML = `
                <h2>Edit Song</h2>
                <input id="title" value="${song.title}">
                <input id="album" value="${song.album}">
                <input id="rating" type="number" min="1" max="10" value="${song.rating}">
                <button onclick="updateSong(${id})">Update</button>
            `;
        });
}

function updateSong(id) {
    const title = document.getElementById("title").value;
    const album = document.getElementById("album").value;
    const rating = document.getElementById("rating").value;

    fetch(`${API}/songs/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, album, rating })
    })
    .then(() => showList(currentPage));
}

function showStats() {
    fetch(`${API}/stats`)
        .then(res => res.json())
        .then(data => {
            const content = document.getElementById("content");

            let albumList = "";
            for (let album in data.albumRankings) {
                albumList += `<li>${album}: ${data.albumRankings[album]}</li>`;
            }

            content.innerHTML = `
                <h2>Statistics</h2>
                Total Songs: ${data.totalSongs}<br>
                Average Rating: ${data.averageRating}<br>
                <h3>Album Rankings (by Avg Rating)</h3>
                <ul>${albumList}</ul>
            `;
        });
}

showList();

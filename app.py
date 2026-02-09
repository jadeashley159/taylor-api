from flask import Flask, request, jsonify
from flask_cors import CORS
import json
import os

app = Flask(__name__)
CORS(app)

DATA_FILE = "data/songs.json"


def load_songs():
    with open(DATA_FILE, "r") as f:
        return json.load(f)


def save_songs(songs):
    with open(DATA_FILE, "w") as f:
        json.dump(songs, f, indent=4)

@app.route("/")
def home():
    return "Taylor API is running!"

@app.route("/api/songs", methods=["GET"])
def get_songs():
    songs = load_songs()
    page = int(request.args.get("page", 1))
    page_size = 10

    total = len(songs)
    total_pages = (total + page_size - 1) // page_size

    start = (page - 1) * page_size
    end = start + page_size

    return jsonify({
        "total": total,
        "page": page,
        "totalPages": total_pages,
        "songs": songs[start:end]
    })


@app.route("/api/songs", methods=["POST"])
def add_song():
    songs = load_songs()
    data = request.json

    if not data.get("title") or not data.get("album"):
        return jsonify({"error": "Title and Album required"}), 400

    try:
        rating = int(data.get("rating"))
        if rating < 1 or rating > 10:
            raise ValueError
    except:
        return jsonify({"error": "Rating must be 1-10"}), 400

    new_id = max(song["id"] for song in songs) + 1
    new_song = {
        "id": new_id,
        "title": data["title"],
        "album": data["album"],
        "rating": rating
    }

    songs.append(new_song)
    save_songs(songs)

    return jsonify(new_song), 201


@app.route("/api/songs/<int:song_id>", methods=["PUT"])
def update_song(song_id):
    songs = load_songs()
    data = request.json

    for song in songs:
        if song["id"] == song_id:
            song["title"] = data["title"]
            song["album"] = data["album"]
            song["rating"] = int(data["rating"])
            save_songs(songs)
            return jsonify(song)

    return jsonify({"error": "Song not found"}), 404


@app.route("/api/songs/<int:song_id>", methods=["DELETE"])
def delete_song(song_id):
    songs = load_songs()
    songs = [song for song in songs if song["id"] != song_id]
    save_songs(songs)
    return jsonify({"message": "Deleted"})

@app.route("/api/stats", methods=["GET"])
def stats():
    songs = load_songs()

    total = len(songs)

    if total == 0:
        return jsonify({
            "totalSongs": 0,
            "averageRating": 0,
            "albumRankings": {}
        })

    avg_rating = round(sum(song["rating"] for song in songs) / total, 2)

    album_totals = {}
    for song in songs:
        album = song["album"]
        album_totals.setdefault(album, []).append(song["rating"])

    album_averages = {
        album: round(sum(ratings)/len(ratings), 2)
        for album, ratings in album_totals.items()
    }

    sorted_albums = dict(
        sorted(album_averages.items(), key=lambda x: x[1], reverse=True)
    )

    return jsonify({
        "totalSongs": total,
        "averageRating": avg_rating,
        "albumRankings": sorted_albums
    })


if __name__ == "__main__":
    app.run(debug=True)

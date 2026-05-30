const express = require("express")
const { spawn } = require("child_process")
const path = require("path")
const fs = require("fs")

const app = express()

app.use(express.static("public"))
app.use("/downloads", express.static("downloads"))

let progress = "0%"
let finished = false
let filename = ""

app.get("/progress", (req, res) => {

    res.json({
        progress,
        finished,
        filename
    })

})

app.get("/download", (req, res) => {

    const url = req.query.url

    if (!url) {

        return res.json({
            success: false,
            message: "Thiếu URL"
        })

    }

    progress = "0%"
    finished = false
    filename = ""

    const getTitle = spawn(".\\yt-dlp", [

        "--get-title",

        "--no-playlist",

        url

    ])

    let title = ""

    getTitle.stdout.on("data", (data) => {

        title += data.toString()

    })

    getTitle.on("close", () => {

        title = title.trim()

        title = title
            .replace(/[\\/:*?"<>|]/g, "")
            .replace(/[^\x20-\x7EÀ-ỹ]/g, "")

        filename = title + ".mp3"

        const output = path.join(
            __dirname,
            "downloads",
            filename
        )

        if (fs.existsSync(output)) {

            fs.unlinkSync(output)

        }

        const yt = spawn(".\\yt-dlp.", [

            "--js-runtimes",
            "node",

            "--no-playlist",

            "-x",

            "--audio-format",
            "mp3",

            "-o",
            output,

            url

        ])

        yt.stdout.on("data", (data) => {

            const text = data.toString()

            console.log(text)

            const match =
                text.match(/(\d+(?:\.\d+)?)%/)

            if (match) {

                progress = match[1] + "%"

            }

        })

        yt.stderr.on("data", (data) => {

            const text = data.toString()

            console.log(text)

            const match =
                text.match(/(\d+(?:\.\d+)?)%/)

            if (match) {

                progress = match[1] + "%"

            }

        })

        yt.on("close", (code) => {

            console.log("Hoàn thành:", code)

            if (code === 0) {

                progress = "100%"
                finished = true

            } else {

                progress = "Lỗi"
                finished = true

            }

        })

    })

    res.json({
        success: true
    })

})

const PORT = process.env.PORT || 3000

app.listen(PORT, () => {

    console.log(`Server chạy tại cổng ${PORT}`)

})
const TC = {}
TC.playing = 0
TC.last_pos = 0
TC.max_tracks = 8
TC.tracks = {}

TC.init = function () {
  TC.create_tracks()
  TC.start_progressbar()
  TC.start_controls()
}

TC.create_tracks = function () {
  let tracks = document.getElementById("tracks")

  for (let i=1; i<=TC.max_tracks; i++) {
    let container = document.createElement("div")
    container.classList.add("track_container")
    
    let number = document.createElement("div")
    number.classList.add("track_number")
    number.textContent = `(${i})`
    
    let play = document.createElement("div")
    play.classList.add("track_play")
    play.classList.add("button")
    play.textContent = "Play"
    play.addEventListener("click", function () {
      TC.play(i)
    })

    let file = document.createElement("input")
    file.type = "file"
    file.classList.add("track_file")

    let audio = document.createElement("audio")
    audio.classList.add("audio")
    audio.addEventListener("playing", function () {
      TC.after_audio_starts(this)
    })
    audio.addEventListener("timeupdate", function () {
      TC.after_audio_plays(this)
    })
    
    container.appendChild(number)
    container.appendChild(play)
    container.appendChild(file)
    container.appendChild(audio)
    tracks.appendChild(container)
    TC.tracks[i] = container
  }
}

TC.play = function (i) {
  let track = TC.tracks[i]
  let audio = track.querySelector(".audio")
  let fileinput = track.querySelector(".track_file")
  let playbutton = track.querySelector(".track_play")

  if (i == TC.playing) {
    playbutton.classList.remove("button_active")
    TC.playing = 0
    TC.last_pos = audio.currentTime
    audio.pause()
    return
  }

  var files = fileinput.files
  
  if (files.length === 0) {
    return
  }

  var path = URL.createObjectURL(files[0])
  TC.pause_all() 
  
  audio.src = path
  audio.currentTime = TC.get_current_pos()
  audio.play()
  TC.playing = i
  
  let buttons = Array.from(document.querySelectorAll(".track_play"))
  for (button of buttons) {
    button.classList.remove("button_active")
  }

  playbutton.classList.add("button_active")
}

TC.pause_all = function () {
  let audios = Array.from(document.querySelectorAll(".audio"))
  for (au of audios) {
    au.pause()
  }
}

TC.get_current_pos = function () {
  if (TC.playing === 0) {
    return TC.last_pos
  }
  
  let track = TC.tracks[TC.playing]
  let audio = track.querySelector(".audio")
  return audio.currentTime
}

TC.format_time = function (n) {
  let seconds = parseInt(n)
  return new Date(seconds * 1000).toISOString().substr(11, 8)
}

TC.after_audio_starts = function (audio) {
  let total = document.querySelector("#progress_total")
  total.textContent = TC.format_time(audio.duration)
}

TC.after_audio_plays = function (audio) {
  let current = document.querySelector("#progress_current")
  current.textContent = TC.format_time(audio.currentTime)
  TC.update_progressbar()
}

TC.start_progressbar = function () {
  let prog = document.querySelector("#progressbar")
  prog.value = 0
  prog.addEventListener("change", function () {
    TC.goto_pos_by_percentage(this.value)
  })
}

TC.update_progressbar = function () {
  if (TC.playing === 0) {
    return
  }

  let audio = TC.get_current_audio()
  let prog = document.querySelector("#progressbar")
  let percentage = parseInt((audio.currentTime / audio.duration) * 100)
  prog.value = percentage
}

TC.goto_pos_by_percentage = function (percentage) {
  let audio = TC.get_current_audio()
  let seconds = (percentage / 100) * audio.duration
  audio.currentTime = seconds
}

TC.get_current_audio = function () {
  return TC.tracks[TC.playing].querySelector(".audio")
}

TC.start_controls = function () {
  let restart = document.querySelector("#ctl_restart")
  restart.addEventListener("click", function () {
    if (TC.playing === 0) {
      return
    }    
    let audio = TC.get_current_audio()
    audio.currentTime = 0
    audio.play()
  })

  let back = document.querySelector("#ctl_back")
  back.addEventListener("click", function () {
    if (TC.playing === 0) {
      return
    }    
    let audio = TC.get_current_audio()
    audio.currentTime = audio.currentTime - 5
    audio.play()
  })
  
  let forward = document.querySelector("#ctl_forward")
  forward.addEventListener("click", function () {
    if (TC.playing === 0) {
      return
    }    
    let audio = TC.get_current_audio()
    audio.currentTime = audio.currentTime + 5
    audio.play()
  })  
}
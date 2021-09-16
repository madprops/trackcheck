const TC = {}
TC.playing = 0
TC.last_playing = 0
TC.last_pos = 0
TC.max_tracks = 8

TC.init = function () {
  TC.create_tracks()
  TC.start_progressbar()
  TC.start_controls()
  TC.start_marks()
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
      TC.play(TC.get_track_index(this.parentNode))
    })

    let up = document.createElement("div")
    up.classList.add("track_up")
    up.classList.add("button")
    up.textContent = "Up"
    up.addEventListener("click", function () {
      TC.go_up(TC.get_track_index(this.parentNode))
    })
    
    let down = document.createElement("div")
    down.classList.add("track_down")
    down.classList.add("button")
    down.textContent = "Down"
    down.addEventListener("click", function () {
      TC.go_down(TC.get_track_index(this.parentNode))
    })
    
    let remove = document.createElement("div")
    remove.classList.add("track_remove")
    remove.classList.add("button")
    remove.textContent = "Remove"
    remove.addEventListener("click", function () {
      TC.remove_track_file(TC.get_track_index(this.parentNode))
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
    container.appendChild(up)
    container.appendChild(down)
    container.appendChild(remove)
    container.appendChild(file)
    container.appendChild(audio)
    tracks.appendChild(container)
  }
}

TC.play = function (i) {
  let track = TC.get_track(i)
  let audio = track.querySelector(".audio")
  let fileinput = track.querySelector(".track_file")

  if (i === TC.playing) {
    TC.last_playing = TC.playing
    TC.playing = 0
    TC.last_pos = audio.currentTime
    audio.pause()
    TC.highlight_play()
    return
  }

  let files = fileinput.files
  
  if (files.length === 0) {
    return
  }

  let path = URL.createObjectURL(files[0])
  TC.pause_all() 
  
  audio.src = path
  audio.currentTime = TC.get_current_pos()
  audio.play()
  TC.playing = i

  TC.highlight_play()
}

TC.pause_all = function () {
  let audios = Array.from(document.querySelectorAll(".audio"))
  for (let au of audios) {
    au.pause()
  }
}

TC.get_current_pos = function () {
  if (TC.playing === 0) {
    return TC.last_pos
  }
  
  let track = TC.get_track(TC.playing)
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
  if (TC.playing === 0) {
    return
  }

  let audio = TC.get_current_audio()
  let seconds = (percentage / 100) * audio.duration
  audio.currentTime = seconds
}

TC.get_current_audio = function () {
  return TC.get_track(TC.playing).querySelector(".audio")
}

TC.start_controls = function () {
  let restart = document.querySelector("#ctl_restart")
  restart.addEventListener("click", function () {
    if (TC.playing === 0) {
      TC.play(TC.last_playing)
      return
    }    
    let audio = TC.get_current_audio()
    audio.currentTime = 0
    audio.play()
  })

  let back = document.querySelector("#ctl_back")
  back.addEventListener("click", function () {
    if (TC.playing === 0) {
      TC.play(TC.last_playing)
      return
    }    
    let audio = TC.get_current_audio()
    audio.currentTime = audio.currentTime - 5
    audio.play()
  })
  
  let forward = document.querySelector("#ctl_forward")
  forward.addEventListener("click", function () {
    if (TC.playing === 0) {
      TC.play(TC.last_playing)
      return
    }    
    let audio = TC.get_current_audio()
    audio.currentTime = audio.currentTime + 5
    audio.play()
  })  

  let unmark = document.querySelector("#ctl_unmark")
  unmark.addEventListener("click", function () {
    TC.unmark()
  })    

  let info = document.querySelector("#ctl_info")
  info.addEventListener("click", function () {
    TC.show_info()
  })    
}

TC.go_up = function (i) {
  if (i <= 1) {
    return
  }

  TC.move_track(TC.get_track(i), "up")

  if (TC.playing === i) {
    TC.playing = i - 1
  } else if (TC.playing === i - 1) {
    TC.playing = i
  }

  TC.highlight_play()
  TC.update_track_number()
}

TC.go_down = function (i) {
  if (i >= TC.max_tracks) {
    return
  }
  
  TC.move_track(TC.get_track(i), "down")

  if (TC.playing === i) {
    TC.playing = i + 1
  } else if (TC.playing === i + 1) {
    TC.playing = i
  }

  TC.highlight_play()
  TC.update_track_number()
}

TC.move_track = function (elem, direction) {
  let parent = elem.parentNode

  if (direction === "up" && elem.previousElementSibling) {
    parent.insertBefore(elem, elem.previousElementSibling)
  } else if (direction === "down" && elem.nextElementSibling) {
    parent.insertBefore(elem, elem.nextElementSibling.nextElementSibling)
  }
}

TC.remove_track_file = function (i) {
  if (confirm("Are you sure?")) {
    let input = TC.get_track(i).querySelector(".track_file")
    input.value = []
  }
}

TC.highlight_play = function () {
  let buttons = Array.from(document.querySelectorAll(".track_play"))
  for (let button of buttons) {
    button.classList.remove("button_active")
  }
  
  if (TC.playing > 0) {
    let playbutton = TC.get_track(TC.playing).querySelector(".track_play")
    playbutton.classList.add("button_active")
  }
}

TC.get_tracks = function () {
  return Array.from(document.querySelectorAll(".track_container"))
}

TC.get_track = function (i) {
  let tracks = TC.get_tracks()
  return tracks[i - 1]
}

TC.get_track_index = function (container) {
  let tracks = TC.get_tracks()
  let i = 1
  for (let track of tracks) {
    if (track === container) {
      return i
    }
    i += 1
  }
}

TC.update_track_number = function () {
  let i = 1
  for (let track of TC.get_tracks()) {
    let number = track.querySelector(".track_number")
    number.textContent = `(${i})`
    i += 1
  }
}

TC.start_marks = function () {
  let marks = document.querySelector("#marks")
  let width = 0
  while (width < marks.clientWidth) {
    let seg = document.createElement("div")
    seg.classList.add("mark_segment")
    seg.style.height = "100%"
    seg.style.width = "10px"
    marks.appendChild(seg)
    width += 10
  }

  marks.addEventListener("click", (e) => {
    if (e.target.classList.contains("mark_segment")) {
      if (e.target.classList.contains("active_mark")) {
        e.target.classList.remove("active_mark")
      } else {
        e.target.classList.add("active_mark")
      }
    }
  })
}

TC.show_info = function () {
  let info = `The purpose of this is to compare similar tracks
For instance if you have two versions/renders of a track
And you want to check subtle differences
You can quickly switch between them
While keeping the progress (time) synched
The markers above the slider are for you to remember points`
  alert(info)
}

TC.unmark = function () {
  let segs = Array.from(document.querySelectorAll(".mark_segment"))
  for (let seg of segs) {
    seg.classList.remove("active_mark")
  }
}
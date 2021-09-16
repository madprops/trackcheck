const TC = {}
TC.playing = 0
TC.last_playing = 0
TC.last_pos = 0
TC.initial_tracks = 4
TC.prog_mouse_down = false

TC.init = function () {
  TC.create_tracks()
  TC.start_progressbar()
  TC.start_controls()
  TC.start_marks()
}

TC.create_tracks = function () {
  for (let i=1; i<=TC.initial_tracks; i++) {
    TC.add_track()
  }

  TC.update_track_number()
}

TC.add_track = function () {
  let tracks = document.getElementById("tracks")
  let container = document.createElement("div")
  container.classList.add("track_container")

  let number = document.createElement("div")
  number.classList.add("track_number")

  let play = document.createElement("div")
  play.classList.add("track_play")
  play.classList.add("button_disabled")
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

  let clear = document.createElement("div")
  clear.classList.add("track_clear")
  clear.classList.add("button")
  clear.textContent = "Clear"
  clear.addEventListener("click", function () {
    TC.clear_track_file(TC.get_track_index(this.parentNode))
  })

  let remove = document.createElement("div")
  remove.classList.add("track_remove")
  remove.classList.add("button")
  remove.textContent = "Remove"
  remove.addEventListener("click", function () {
    TC.remove_track(this.closest(".track_container"))
  })

  let file = document.createElement("input")
  file.type = "file"
  file.classList.add("track_file")
  file.addEventListener("change", function () {
    if (this.value) {
      TC.enable_play_button(this.parentNode)
    } else {
      TC.disable_play_button(this.parentNode)
    }
  })

  let audio = document.createElement("audio")
  audio.classList.add("audio")
  audio.addEventListener("playing", function () {
    TC.after_audio_starts(this)
  })
  audio.addEventListener("timeupdate", function () {
    TC.after_audio_plays(this)
  })
  audio.addEventListener("ended", function () {
    TC.after_audio_ends(this)
  })

  container.appendChild(number)
  container.appendChild(play)
  container.appendChild(up)
  container.appendChild(down)
  container.appendChild(clear)
  container.appendChild(remove)
  container.appendChild(file)
  container.appendChild(audio)
  tracks.appendChild(container)
}

TC.play = function (i, current_time = -1) {
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

  if (current_time === -1) {
    audio.currentTime = TC.get_current_pos()
  } else {
    audio.currentTime = current_time
  }

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

TC.after_audio_ends = function (audio) {
  if (TC.playing !== 0) {
    TC.restart()
  }
}

TC.start_progressbar = function () {
  let prog = document.querySelector("#progressbar")
  prog.value = 0
  prog.addEventListener("change", function () {
    TC.goto_pos_by_percentage(this.value)
  })
  prog.addEventListener("mousedown", function () {
    TC.prog_mouse_down = true
  })
  prog.addEventListener("mouseup", function () {
    TC.prog_mouse_down = false
  })
}

TC.update_progressbar = function () {
  if (TC.playing === 0 || TC.prog_mouse_down) {
    return
  }

  let audio = TC.get_current_audio()
  let prog = document.querySelector("#progressbar")
  let percentage = parseInt((audio.currentTime / audio.duration) * 100)
  prog.value = percentage
}

TC.goto_pos_by_percentage = function (percentage) {
  if (TC.playing === 0) {
    if (TC.last_playing !== 0) {
      let audio = TC.get_previous_audio()
      let seconds = (percentage / 100) * audio.duration
      TC.play(TC.last_playing, seconds)
    }
    return
  } else {
    let audio = TC.get_current_audio()
    let seconds = (percentage / 100) * audio.duration
    audio.currentTime = seconds
  }
}

TC.get_current_audio = function () {
  return TC.get_track(TC.playing).querySelector(".audio")
}

TC.get_previous_audio = function () {
  return TC.get_track(TC.last_playing).querySelector(".audio")
}

TC.start_controls = function () {
  let restart = document.querySelector("#ctl_restart")
  restart.addEventListener("click", function () {
    if (TC.playing === 0) {
      if (TC.last_playing !== 0) {
        TC.play(TC.last_playing)
      }
      return
    }
    TC.restart()
  })

  let back = document.querySelector("#ctl_back")
  back.addEventListener("click", function () {
    if (TC.playing === 0) {
      if (TC.last_playing !== 0) {
        TC.play(TC.last_playing)
      }
      return
    }
    let audio = TC.get_current_audio()
    audio.currentTime = audio.currentTime - 5
    audio.play()
  })

  let forward = document.querySelector("#ctl_forward")
  forward.addEventListener("click", function () {
    if (TC.playing === 0) {
      if (TC.last_playing !== 0) {
        TC.play(TC.last_playing)
      }
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

  let add_track = document.querySelector("#ctl_add_track")
  add_track.addEventListener("click", function () {
    TC.add_track()
    TC.update_track_number()
  })

  let info = document.querySelector("#ctl_info")
  info.addEventListener("click", function () {
    TC.show_info()
  })
}

TC.go_up = function (i) {
  let dir = "up"
  if (i <= 1) {
    dir = "wrap_down"
  }

  TC.move_track(TC.get_track(i), dir)

  if (TC.playing !== 0) {
    if (TC.playing === i) {
      TC.playing = i - 1
    } else if (TC.playing === i - 1) {
      TC.playing = i
    }
  }

  TC.highlight_play()
  TC.update_track_number()
}

TC.go_down = function (i) {
  let dir = "down"
  if (i >= TC.get_tracks().length) {
    dir = "wrap_up"
  }

  TC.move_track(TC.get_track(i), dir)

  if (TC.playing !== 0) {
    if (TC.playing === i) {
      TC.playing = i + 1
    } else if (TC.playing === i + 1) {
      TC.playing = i
    }
  }

  TC.highlight_play()
  TC.update_track_number()
}

TC.move_track = function (elem, dir) {
  let parent = elem.parentNode

  if (dir === "up" && elem.previousElementSibling) {
    parent.insertBefore(elem, elem.previousElementSibling)
  } else if (dir === "down" && elem.nextElementSibling) {
    parent.insertBefore(elem, elem.nextElementSibling.nextElementSibling)
  } else if (dir === "wrap_down" && elem.nextElementSibling) {
    parent.appendChild(elem)
  } else if (dir === "wrap_up" && elem.previousElementSibling) {
    parent.prepend(elem)
  }
}

TC.clear_track_file = function (i) {
  if (confirm("Are you sure?")) {
    if (TC.playing === i) {
      TC.play(i)
    }
    let track = TC.get_track(i)
    let input = track.querySelector(".track_file")
    input.value = []
    TC.disable_play_button(track)
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

  marks.addEventListener("mousedown", (e) => {
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

TC.remove_track = function (track) {
  if (confirm("Are you sure?")) {
    let i = TC.get_track_index(track)
    if (TC.playing === i) {
      TC.play(i)
    }
    track.parentNode.removeChild(track)
    TC.update_track_number()
  }
}

TC.restart = function () {
  let audio = TC.get_current_audio()
  audio.currentTime = 0
  audio.play()
}

TC.enable_play_button = function (track) {
  let play = track.querySelector(".track_play")
  play.classList.remove("button_disabled")
}

TC.disable_play_button = function (track) {
  let play = track.querySelector(".track_play")
  play.classList.add("button_disabled")
}
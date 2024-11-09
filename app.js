document.addEventListener("DOMContentLoaded", () => {
  const taskForm = document.querySelector(".task-form");
  const taskInput = document.getElementById("task-input");
  const taskList = document.getElementById("task-list");
  const modeToggle = document.getElementById("mode-toggle");
  const filterButtons = document.querySelectorAll(".filter-button");
  const voiceInputButton = document.getElementById("voice-input");

  loadTasks();
  loadMode();

  taskForm.addEventListener("submit", (e) => {
    e.preventDefault();
    addTask(taskInput.value);
    taskInput.value = "";
  });

  modeToggle.addEventListener("click", () => {
    document.body.classList.toggle("dark-mode");
    updateModeIcon();
    saveMode();
  });

  filterButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const filter = button.getAttribute("data-filter");
      filterTasks(filter);
    });
  });

  function updateModeIcon() {
    if (document.body.classList.contains("dark-mode")) {
      modeToggle.innerHTML = '<i class="fas fa-moon"></i>';
    } else {
      modeToggle.innerHTML = '<i class="fas fa-sun"></i>';
    }
  }

  function addTask(taskText) {
    if (taskText.trim() === "") return;

    const taskItem = document.createElement("li");
    taskItem.className = "task-item";

    const taskTextSpan = document.createElement("span");
    taskTextSpan.textContent = taskText;
    taskItem.appendChild(taskTextSpan);

    const completeButton = document.createElement("button");
    completeButton.innerHTML = '<i class="fas fa-check"></i>';
    completeButton.className = "complete-button";
    completeButton.addEventListener("click", () => {
      taskItem.classList.toggle("completed");
      saveTasks();
    });

    const editButton = document.createElement("button");
    editButton.innerHTML = '<i class="fas fa-edit"></i>';
    editButton.className = "edit-button";
    editButton.addEventListener("click", () => {
      enterEditMode(taskItem, taskTextSpan);
    });

    const deleteButton = document.createElement("button");
    deleteButton.innerHTML = '<i class="fas fa-trash"></i>';
    deleteButton.className = "delete-button";
    deleteButton.addEventListener("click", () => {
      taskItem.remove();
      saveTasks();
    });

    taskItem.appendChild(completeButton);
    taskItem.appendChild(editButton);
    taskItem.appendChild(deleteButton);
    taskList.appendChild(taskItem);
    saveTasks();
  }

  function filterTasks(filter) {
    taskList.querySelectorAll(".task-item").forEach((taskItem) => {
      const isCompleted = taskItem.classList.contains("completed");
      if (
        filter === "all" ||
        (filter === "completed" && isCompleted) ||
        (filter === "active" && !isCompleted)
      ) {
        taskItem.style.display = "";
      } else {
        taskItem.style.display = "none";
      }
    });
  }

  function enterEditMode(taskItem, taskTextSpan) {
    const currentText = taskTextSpan.textContent.trim();
    const editInput = document.createElement("input");
    editInput.type = "text";
    editInput.value = currentText;
    editInput.className = "edit-input";
    taskItem.replaceChild(editInput, taskTextSpan);
    editInput.focus();
    editInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        saveEditedTask(taskItem, editInput.value, editInput);
      }
    });
    editInput.addEventListener("blur", () => {
      saveEditedTask(taskItem, editInput.value, editInput);
    });
  }

  function saveEditedTask(taskItem, newText, editInput) {
    if (newText.trim() === "") {
      taskItem.remove();
    } else {
      const taskTextSpan = document.createElement("span");
      taskTextSpan.textContent = newText;
      taskItem.replaceChild(taskTextSpan, editInput);
      taskItem.querySelector(".edit-button").addEventListener("click", () => {
        enterEditMode(taskItem, taskTextSpan);
      });
    }
    saveTasks();
  }

  function saveTasks() {
    const tasks = [];
    taskList.querySelectorAll(".task-item").forEach((taskItem) => {
      const taskText = taskItem.querySelector("span").textContent.trim();
      tasks.push({
        text: taskText,
        completed: taskItem.classList.contains("completed"),
      });
    });
    localStorage.setItem("tasks", JSON.stringify(tasks));
  }

  function loadTasks() {
    const tasks = JSON.parse(localStorage.getItem("tasks")) || [];
    tasks.forEach((task) => {
      const taskItem = document.createElement("li");
      taskItem.className = "task-item";
      const taskTextSpan = document.createElement("span");
      taskTextSpan.textContent = task.text;
      taskItem.appendChild(taskTextSpan);
      if (task.completed) {
        taskItem.classList.add("completed");
      }

      const completeButton = document.createElement("button");
      completeButton.innerHTML = '<i class="fas fa-check"></i>';
      completeButton.className = "complete-button";
      completeButton.addEventListener("click", () => {
        taskItem.classList.toggle("completed");
        saveTasks();
      });

      const editButton = document.createElement("button");
      editButton.innerHTML = '<i class="fas fa-edit"></i>';
      editButton.className = "edit-button";
      editButton.addEventListener("click", () => {
        enterEditMode(taskItem, taskTextSpan);
      });

      const deleteButton = document.createElement("button");
      deleteButton.innerHTML = '<i class="fas fa-trash"></i>';
      deleteButton.className = "delete-button";
      deleteButton.addEventListener("click", () => {
        taskItem.remove();
        saveTasks();
      });

      taskItem.appendChild(completeButton);
      taskItem.appendChild(editButton);
      taskItem.appendChild(deleteButton);
      taskList.appendChild(taskItem);
    });
  }

  function saveMode() {
    const isDarkMode = document.body.classList.contains("dark-mode");
    localStorage.setItem("darkMode", isDarkMode);
  }

  function loadMode() {
    const isDarkMode = JSON.parse(localStorage.getItem("darkMode"));
    if (isDarkMode) {
      document.body.classList.add("dark-mode");
      updateModeIcon();
    }
  }

  if ("webkitSpeechRecognition" in window) {
    const recognition = new webkitSpeechRecognition();
    recognition.continuous = false; // Set to false to handle discrete inputs
    recognition.interimResults = false; // Only handle final results for accuracy
    recognition.lang = "en-US";

    voiceInputButton.addEventListener("click", () => {
      try {
        recognition.start();
        console.log("Voice recognition started.");
        // Show SweetAlert toast when voice recognition starts
        Swal.fire({
          icon: "info",
          title: "Listening...",
          text: "Please articulate your task. The recognition will conclude automatically once you finish speaking.",
          toast: true,
          position: "top-end",
          showConfirmButton: false,
          timerProgressBar: true,
          didOpen: () => {
            Swal.showLoading();
          },
        });
      } catch (error) {
        console.error("Error starting voice recognition:", error);
      }
    });

    recognition.onresult = (event) => {
      const voiceInput = event.results[0][0].transcript;
      console.log("Voice input received:", voiceInput);

      // Split tasks based on common separators like "and" or "next"
      const tasks = voiceInput
        .split(/(?:and|next|then|after that)/i)
        .map((task) => task.trim());

      tasks.forEach((task) => {
        if (task) addTask(task);
      });

      taskInput.value = "";
    };

    recognition.onerror = (event) => {
      console.error("Voice recognition error:", event.error);
      if (event.error === "not-allowed") {
        Swal.fire({
          icon: "error",
          title: "Microphone Access Denied",
          text: "Microphone access is not allowed. Please check your browser settings.",
        });
      }
    };

    recognition.onend = () => {
      console.log("Voice recognition ended.");
      setTimeout(() => {
        Swal.close();
      }, 1000); // Delay closing for 1 second
    };
  } else {
    console.warn("Speech recognition not supported in this browser.");
    voiceInputButton.style.display = "none";
  }
});

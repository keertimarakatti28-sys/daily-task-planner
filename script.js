const STORAGE_KEY = "glowlogics-daily-tasks";

const taskForm = document.querySelector("#task-form");
const taskInput = document.querySelector("#task-input");
const taskList = document.querySelector("#task-list");
const emptyState = document.querySelector("#empty-state");
const formMessage = document.querySelector("#form-message");
const currentDate = document.querySelector("#current-date");
const taskCountLabel = document.querySelector("#task-count-label");
const progressValue = document.querySelector("#progress-value");
const filterButtons = document.querySelectorAll(".filter-button");
const clearCompletedButton = document.querySelector("#clear-completed");

let tasks = loadTasks();
let activeFilter = "all";

function loadTasks() {
  try {
    const storedTasks = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return Array.isArray(storedTasks) ? storedTasks : [];
  } catch {
    return [];
  }
}

function saveTasks() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}

function updateDate() {
  const today = new Date();
  currentDate.dateTime = today.toISOString().slice(0, 10);
  currentDate.textContent = today.toLocaleDateString(undefined, {
    weekday: "long",
    month: "short",
    day: "numeric",
    year: "numeric"
  });
}

function getVisibleTasks() {
  if (activeFilter === "pending") return tasks.filter((task) => !task.completed);
  if (activeFilter === "completed") return tasks.filter((task) => task.completed);
  return tasks;
}

function render() {
  const visibleTasks = getVisibleTasks();
  const completedCount = tasks.filter((task) => task.completed).length;
  const pendingCount = tasks.length - completedCount;
  const completion = tasks.length ? Math.round((completedCount / tasks.length) * 100) : 0;

  taskList.replaceChildren();
  visibleTasks.forEach((task, index) => taskList.appendChild(createTaskElement(task, index)));
  emptyState.hidden = visibleTasks.length > 0;
  taskCountLabel.textContent = `${tasks.length} ${tasks.length === 1 ? "task" : "tasks"}`;
  progressValue.textContent = `${completion}%`;
  document.querySelector("#all-count").textContent = tasks.length;
  document.querySelector("#pending-count").textContent = pendingCount;
  document.querySelector("#completed-count").textContent = completedCount;
  clearCompletedButton.disabled = completedCount === 0;
}

function createTaskElement(task, index) {
  const item = document.createElement("article");
  item.className = `task-item${task.completed ? " completed" : ""}`;
  item.style.animationDelay = `${index * 35}ms`;
  item.dataset.id = task.id;

  const checkButton = document.createElement("button");
  checkButton.className = "check-button";
  checkButton.type = "button";
  checkButton.setAttribute("aria-label", task.completed ? `Mark ${task.title} pending` : `Complete ${task.title}`);
  checkButton.innerHTML = task.completed ? '<i class="bi bi-check2"></i>' : "";
  checkButton.addEventListener("click", () => toggleTask(task.id));

  const title = document.createElement("span");
  title.className = "task-title";
  title.textContent = task.title;

  const actions = document.createElement("div");
  actions.className = "task-actions";
  actions.append(createActionButton("bi-pencil", "Edit task", () => startEditing(item, task)));
  actions.append(createActionButton("bi-trash3", "Delete task", () => deleteTask(task.id), "delete"));

  item.append(checkButton, title, actions);
  return item;
}

function createActionButton(icon, label, action, extraClass = "") {
  const button = document.createElement("button");
  button.className = `icon-button ${extraClass}`;
  button.type = "button";
  button.setAttribute("aria-label", label);
  button.innerHTML = `<i class="bi ${icon}"></i>`;
  button.addEventListener("click", action);
  return button;
}

function addTask(title) {
  tasks.unshift({ id: crypto.randomUUID(), title, completed: false });
  saveTasks();
  render();
}

function toggleTask(id) {
  tasks = tasks.map((task) => task.id === id ? { ...task, completed: !task.completed } : task);
  saveTasks();
  render();
}

function deleteTask(id) {
  tasks = tasks.filter((task) => task.id !== id);
  saveTasks();
  render();
}

function startEditing(item, task) {
  const title = item.querySelector(".task-title");
  const actions = item.querySelector(".task-actions");
  const input = document.createElement("input");
  input.className = "edit-input";
  input.type = "text";
  input.maxLength = 120;
  input.value = task.title;
  input.setAttribute("aria-label", "Edit task");

  const saveButton = createActionButton("bi-check-lg", "Save task", () => saveEdit(task.id, input.value));
  const cancelButton = createActionButton("bi-x-lg", "Cancel editing", render);
  title.replaceWith(input);
  actions.replaceChildren(saveButton, cancelButton);
  input.focus();
  input.select();
  input.addEventListener("keydown", (event) => {
    if (event.key === "Enter") saveEdit(task.id, input.value);
    if (event.key === "Escape") render();
  });
}

function saveEdit(id, title) {
  const cleanTitle = title.trim();
  if (!cleanTitle) return;
  tasks = tasks.map((task) => task.id === id ? { ...task, title: cleanTitle } : task);
  saveTasks();
  render();
}

taskForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const title = taskInput.value.trim();
  if (!title) {
    formMessage.textContent = "Give your task a name first.";
    taskInput.focus();
    return;
  }
  formMessage.textContent = "";
  addTask(title);
  taskInput.value = "";
  taskInput.focus();
});

filterButtons.forEach((button) => {
  button.addEventListener("click", () => {
    activeFilter = button.dataset.filter;
    filterButtons.forEach((filterButton) => filterButton.classList.toggle("active", filterButton === button));
    render();
  });
});

clearCompletedButton.addEventListener("click", () => {
  tasks = tasks.filter((task) => !task.completed);
  saveTasks();
  render();
});

updateDate();
render();

// Task Manager Application with Advanced Features
class TaskManager {
    constructor() {
        this.tasks = this.loadTasks();
        this.currentFilter = 'all';
        this.currentSort = 'date';
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.updateDate();
        this.render();
    }

    setupEventListeners() {
        // Add task events
        document.getElementById('addTaskBtn').addEventListener('click', () => this.addTask());
        document.getElementById('taskInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.addTask();
        });

        // Clear completed
        document.getElementById('clearBtn').addEventListener('click', () => this.clearCompleted());

        // Export/Import
        document.getElementById('exportBtn').addEventListener('click', () => this.exportTasks());
        document.getElementById('importBtn').addEventListener('click', () => {
            document.getElementById('importFile').click();
        });
        document.getElementById('importFile').addEventListener('change', (e) => this.importTasks(e));

        // Filter buttons
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.currentFilter = e.target.dataset.filter;
                this.render();
            });
        });

        // Sort buttons
        document.querySelectorAll('.sort-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.sort-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.currentSort = e.target.dataset.sort;
                this.render();
            });
        });
    }

    addTask() {
        const input = document.getElementById('taskInput');
        const priority = document.getElementById('prioritySelect').value;
        const taskText = input.value.trim();

        if (!taskText) {
            alert('Please enter a task!');
            return;
        }

        const task = {
            id: Date.now(),
            text: taskText,
            priority: priority,
            completed: false,
            createdAt: new Date()
        };

        this.tasks.unshift(task);
        this.saveTasks();
        input.value = '';
        this.render();
        input.focus();
    }

    deleteTask(id) {
        this.tasks = this.tasks.filter(task => task.id !== id);
        this.saveTasks();
        this.render();
    }

    toggleTask(id) {
        const task = this.tasks.find(t => t.id === id);
        if (task) {
            task.completed = !task.completed;
            this.saveTasks();
            this.render();
        }
    }

    clearCompleted() {
        if (this.tasks.some(t => t.completed)) {
            if (confirm('Are you sure you want to clear all completed tasks?')) {
                this.tasks = this.tasks.filter(t => !t.completed);
                this.saveTasks();
                this.render();
            }
        }
    }

    exportTasks() {
        const dataStr = JSON.stringify(this.tasks, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `tasks-${new Date().toISOString().split('T')[0]}.json`;
        link.click();
        URL.revokeObjectURL(url);
    }

    importTasks(event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const imported = JSON.parse(e.target.result);
                if (Array.isArray(imported)) {
                    // Convert date strings back to Date objects
                    imported.forEach(task => {
                        if (typeof task.createdAt === 'string') {
                            task.createdAt = new Date(task.createdAt);
                        }
                    });
                    this.tasks = imported;
                    this.saveTasks();
                    this.render();
                    alert('Tasks imported successfully!');
                } else {
                    alert('Invalid file format. Please import a valid tasks JSON file.');
                }
            } catch (error) {
                alert('Error importing tasks: ' + error.message);
            }
        };
        reader.readAsText(file);
        event.target.value = ''; // Reset input
    }

    getFilteredTasks() {
        switch (this.currentFilter) {
            case 'active':
                return this.tasks.filter(t => !t.completed);
            case 'completed':
                return this.tasks.filter(t => t.completed);
            default:
                return this.tasks;
        }
    }

    getSortedTasks(tasks) {
        const sorted = [...tasks];
        
        switch (this.currentSort) {
            case 'priority':
                const priorityOrder = { high: 0, medium: 1, low: 2 };
                sorted.sort((a, b) => {
                    return priorityOrder[a.priority] - priorityOrder[b.priority];
                });
                break;
            case 'name':
                sorted.sort((a, b) => a.text.localeCompare(b.text));
                break;
            case 'date':
            default:
                sorted.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
                break;
        }
        
        return sorted;
    }

    updateStats() {
        const total = this.tasks.length;
        const completed = this.tasks.filter(t => t.completed).length;
        const remaining = total - completed;

        document.getElementById('totalTasks').textContent = total;
        document.getElementById('completedTasks').textContent = completed;
        document.getElementById('remainingTasks').textContent = remaining;
    }

    updateDate() {
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        const today = new Date().toLocaleDateString('en-US', options);
        document.getElementById('currentDate').textContent = today;
    }

    formatDate(date) {
        const d = new Date(date);
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        if (d.toDateString() === today.toDateString()) {
            return 'Today ' + d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
        } else if (d.toDateString() === yesterday.toDateString()) {
            return 'Yesterday';
        } else {
            return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        }
    }

    render() {
        const taskList = document.getElementById('taskList');
        const emptyState = document.getElementById('emptyState');
        let filteredTasks = this.getFilteredTasks();
        const sortedTasks = this.getSortedTasks(filteredTasks);

        taskList.innerHTML = '';

        if (sortedTasks.length === 0) {
            emptyState.classList.remove('hidden');
            this.updateStats();
            return;
        }

        emptyState.classList.add('hidden');

        sortedTasks.forEach(task => {
            const li = document.createElement('li');
            li.className = `task-item priority-${task.priority} ${task.completed ? 'completed' : ''}`;
            
            const priorityLabel = task.priority.charAt(0).toUpperCase() + task.priority.slice(1);
            
            li.innerHTML = `
                <input 
                    type="checkbox" 
                    class="checkbox" 
                    ${task.completed ? 'checked' : ''}
                    onchange="taskManager.toggleTask(${task.id})"
                >
                <div class="task-content">
                    <span class="task-text">${this.escapeHtml(task.text)}</span>
                    <div class="task-meta">
                        <span class="priority-badge ${task.priority}">${priorityLabel}</span>
                        <span class="task-date">${this.formatDate(task.createdAt)}</span>
                    </div>
                </div>
                <button class="delete-btn" onclick="taskManager.deleteTask(${task.id})">Delete</button>
            `;
            taskList.appendChild(li);
        });

        this.updateStats();
        document.getElementById('clearBtn').disabled = !this.tasks.some(t => t.completed);
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    saveTasks() {
        localStorage.setItem('tasks', JSON.stringify(this.tasks));
    }

    loadTasks() {
        const saved = localStorage.getItem('tasks');
        if (saved) {
            const tasks = JSON.parse(saved);
            // Ensure createdAt is a valid date
            tasks.forEach(task => {
                if (typeof task.createdAt === 'string') {
                    task.createdAt = new Date(task.createdAt);
                }
            });
            return tasks;
        }
        return [];
    }
}

// Initialize the application
const taskManager = new TaskManager();

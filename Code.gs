// Copyright 2013 Google Inc. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * Special function that handles HTTP GET requests to the published web app.
 * @return {HtmlOutput} The HTML page to be served.
 */
function doGet(e) {
  var t = HtmlService.createTemplateFromFile('Page')
  
  t.startingNote = e.parameter.startingNote;
  t.startingTitle = e.parameter.startingTitle;

  return t.evaluate()
      .setTitle('Geoff Tasks')
      .setSandboxMode(HtmlService.SandboxMode.IFRAME);
}

/**
 * Returns the ID and name of every task list in the user's account,
 * sorted alphabetically by task list name.
 * @return {Array.<Object>} The task list data.
 */
function getTaskLists() {
  
  var list = Tasks.Tasklists.list();
 
  var taskLists = [];
  var currentItems = list.getItems();
  while(currentItems) {
    taskLists = taskLists.concat(currentItems);
    if (list.nextPageToken) {
      list = Tasks.Tasklists.list({pageToken: list.nextPageToken});
      currentItems = list.getItems();
    } else {
      break;
    }
  }
  
  taskLists = taskLists.map(function(taskList) {
    return {
      id: taskList.getId(),
      name: taskList.getTitle()
    };
  });
  
  return taskLists.sort(function(a, b) {
    if (a.name < b.name) {
      return -1;
    }
    if (a.name > b.name) {
      return 1;
    }
    // a must be equal to b
    return 0;
  });
}

/**
 * Returns information about the tasks within a given task list.
 * @param {String} taskListId The ID of the task list.
 * @return {Array.<Object>} The task data.
 */
function getTasks(taskListId) {
  var tasks = Tasks.Tasks.list(taskListId).getItems();
  if (!tasks) {
    return [];
  }
  return tasks.map(function(task) {
    return {
      id: task.getId(),
      title: task.getTitle(),
      notes: task.getNotes(),
      completed: Boolean(task.getCompleted())
    };
  }).filter(function(task) {
    return task.title
  });
}

/**
 * Sets the completed status of a given task.
 * @param {String} taskListId The ID of the task list.
 * @param {String} taskId The ID of the task.
 * @param {Boolean} completed True if the task should be marked as complete, false otherwise.
 */
function setCompleted(taskListId, taskId, completed) {
  var task = Tasks.newTask();
  if (completed) {
    task.setStatus('completed');
  } else {
    task.setStatus('needsAction');
    task.setCompleted(null);
  }
  Tasks.Tasks.patch(task, taskListId, taskId);
}

/**
 * Adds a new task to the task list.
 * @param {String} taskListId The ID of the task list.
 * @param {String} title The title of the new task.
 * @param {String} note The note the new task.
 * @param {Date} date The Javascript date object of the new task.
 */
function addTask(taskListId, title, note, date) {
  
  var task = Tasks.newTask().setTitle(title);
  if (note) {
    task.notes = note;
  }
  if (date) {
    task.due = date;
  }
  Tasks.Tasks.insert(task, taskListId);
}

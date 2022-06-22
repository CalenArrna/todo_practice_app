//jshint sversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require('lodash');
const { Schema } = mongoose;

const app = express();

app.use(bodyParser.urlencoded({
  extended: true
}));

app.use(express.static("public"));

app.set('view engine', 'ejs');

mongoose.connect(`mongodb+srv://${process.env.MONGO_USERNAME}:${process.env.MONGO_PASSWORD}@cluster0.a8w3bum.mongodb.net/todoListDB`);

const todoSchema = new Schema({
  name: String
});

const listSchema = new Schema({
  name: String,
  todos: [todoSchema]
});

const List = mongoose.model("List", listSchema);

const Todo = mongoose.model("Todo", todoSchema);

const todo1 = new Todo({name: "Welcome to your ToDoList!"});
const todo2 = new Todo({name: "Hit the + button to add a new one!"});
const todo3 = new Todo({name: "<-- Hit this to delete a todo!"});

const defaultTodos = [todo1, todo2, todo3];

app.get("/", (req, res) => {
  Todo.find({}, (err, result) => {
    if (err) {
      console.log(err);
    }else {
      if(result.length === 0) {
        Todo.insertMany(defaultTodos, (err)=>{
          if(err) {
            console.log(err);
          } else {
            console.log("Init todos added successfully to database!");
          }
        });
        res.redirect("/");
      }else{
        res.render('list', {
          tListTitle: "Today",
          tTodoList: result
        });
      }
    }
  });
});

app.post("/", (req, res) => {
  todoName = req.body.todo;
  listTitle = _.capitalize(req.body.list);

  if (todoName !== "") {
    let newItem = new Todo({
      name: todoName
    });

    if(listTitle === "Today") {
      newItem.save((error)=> {
        if(error) {
          return handleError(error);
        }
        res.redirect("/");
      });
    } else {
      List.findOne({name: listTitle}, (err, foundList) => {
        if(!err){
          foundList.todos.push(newItem);
          foundList.save();
          res.redirect(`/${listTitle}`);
        }else console.log("There was an error finding the list in post request for custom list.");
      });
    }
  } else {
    res.redirect(listTitle === "Today"? "/" : `/${listTitle}`);
  }
});

app.get("/:customListName", (req, res) => {
  const customListName = _.capitalize(req.params.customListName);

  List.findOne({name: customListName}, (err, result) => {
    if(result === null) {
        const newList = new List({
          name: customListName,
          todos: defaultTodos });

        newList.save((err)=>{
          if(!err) {
            console.log("List was saved successfully!");
            res.redirect(`/${customListName}`);
          }else console.log(err);
        });
    }else{
      res.render("list", {
        tListTitle: result.name,
        tTodoList: result.todos
      });
    }
  })

});


app.post("/delete", (req, res) => {
  const todoId = req.body.checkbox;
  const listName = req.body.listName;

  if(listName === "Today") {
    Todo.deleteOne({_id: todoId}, (error) => {
      if(error) {
        console.log(`Delete todo failed due to: ${error}`);
      }else {
        console.log(`Delete todo with ${todoId} ID was successfull.`)
      }
      res.redirect("/");
    });
  } else {
    List.findOne({name: listName}, (err, foundList) => {
      foundList.todos.id(todoId).remove();
      foundList.save();
      res.redirect(`/${listName}`);
    });
  }
});

let port = process.env.PORT;
// if (port == null || port == "") {
//   port = 3000;
// }

app.listen(port, () => {
  console.log(`App is listening to port ${port}.`);
});

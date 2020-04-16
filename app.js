//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const _ = require("lodash");

const mongoose = require("mongoose");



const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

mongoose.connect("mongodb://localhost:27017/bookmarkintern", {useNewUrlParser: true});


const itemsSchema = {
  name: String
};

const Item = mongoose.model("Item",itemsSchema);

const item1 = new Item ({

 name: "Welcome to your Todo List"

});

const item2 = new Item ({

 name: "Hit the + button to add an item."

});

const item3 = new Item ({

 name: "<-- Hit this to delete an item."

});

const defaultItems = [item1, item2, item3];

const listSchema = {
  name: String,
  items: [itemsSchema]
};

const List = mongoose.model("List",listSchema);


//INITIAL PAGE WITH THE DEFAULT BOOKMARKS
app.get("/", function(req, res) {
  List.find({},function(err,lists){
    Item.find({}, function(err,items){

      if(items.length == 0){

        Item.insertMany(defaultItems,function(err){

          if(err){
            console.log(err)
          }
          else{
            console.log("Successfully inserted default items")
          }
        });
        res.redirect("/");
      }

      else{

        res.render("list", {listTitle: "Home Page", newListItems: items, lists: lists});
      }

    });
 });

  });


// SPECIFIC TAG BOOKMARKS ARE RETRIVED
app.get("/:customListName", function(req, res){

  const customListName = req.params.customListName;
 List.find({},function(err,lists){
  List.findOne({name: customListName} , function(err, foundItemsofList){
   if(!err){
     if(!foundItemsofList){
       const list = new List({

        name: customListName,
        items: defaultItems
      });

       list.save();
    //   res.send(list);
       res.redirect("/"+ customListName);
     }
     else{
      // res.send(foundItemsofList); // the list and their items
        //res. write(foundList.items); //just the items of the list
       res.render("list",{listTitle: foundItemsofList.name , newListItems: foundItemsofList.items,lists:lists});
    }
  }
  else{
    console.log(err)
  }
});
});
});


//Creating a folder to create a add the bookmarks to it
app.post("/createList",function(req,res){

  const name = req.body.newList;
  console.log(name);
   List.findOne({name: name} , function(err, foundList){
   if(!err){
     if(!foundList){
       const list = new List({

        name: name,
      });

       list.save();

         res.redirect("/"+ name);
     }
     else{

      res.redirect("/"+name);
    }
  }
  else{
    console.log(err)
  }
});

});


//Creating the tags to add bookmarks to it
app.post("/createTag",function(req,res){
var count = 0;
     var itemName = req.body.newItem;
          console.log(itemName);



  var tagName = req.body.newTag;
      console.log(tagName);
  var string = tagName.split(",");
      console.log(string);
  string.forEach(elements => {
   List.findOne({name: elements} , function(err, foundList){
   if(!err){
     if(!foundList){
       console.log("not found creating");
       const list = new List({

        name: elements,

      });

       list.save();

    console.log(elements);

              const item = new Item({
                    name: itemName
                });


              list.items.push(item);
              list.save();
              console.log("found it");


   }
     else{

             List.find({"items.name":itemName}, function(err,lists){
               if(lists.length == 0){

                     const item = new Item({
                           name: itemName
                       });


                       foundList.items.push(item);
                       foundList.save();
                       console.log("found it");

               }


            });

    }
  }
  else{
    console.log(err)
  }
});
});

res.redirect("/");




});


//Retriving all bookmarks
app.post("/getAllBookmarks",function(req,res){
List.find({},function(err,lists){
  var itemsName = [];
  if(err)
  {
    console.log(err);
  }
  else{

    lists.forEach(function(list){
      list.items.forEach(function(name){
        //console.log(name.name);
        itemsName.push(name.name);

      });
  });
  console.log(itemsName);
    res.render("about", {listTitle:"BookMarks",listdata:itemsName});

}
});
});


//Retriving all tags
app.post("/getAllTags",function(req,res){
List.find({},function(err,lists){
  var tagsName = [];
  if(err)
  {

    console.log(err);
  }
  else{
    console.log(lists);
    lists.forEach(function(list){
        //console.log(name.name);
        tagsName.push(list.name);

      });

  //console.log(itemsName);
    res.render("about", {listTitle:"TAGS",listdata:tagsName});
  //  res.render("about", {list: "lists"});
  }
});
});


//deleting specific bookmark from the folder or tags
app.post("/delete",function(req, res){

  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;
console.log(listName);
  if(listName === "Home Page"){
    Item.findByIdAndRemove(checkedItemId, function(err){
      if(err){
       console.log(err);
       console.log("error");
     }
     else{

      console.log("Successfully deleted");
      res.redirect("/");
      //res.send("deleted Successfully");
    }
  });
  }

  else {
    List.findOneAndUpdate(
     {name: listName},
     {$pull: {items: {_id:checkedItemId}}},
     function(err, foundList){
      if(!err){
        console.log("deleted");

        //res.send("deleted Successfully");
        res.redirect("/"+listName);
      }
    }

    )
  }

});

app.post("/deleteTag",function(req, res){

  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;
console.log(listName);



    List.deleteOne(
     {_id: checkedItemId},
     function(err){
      if(!err){
        console.log("deleted");

        //res.send("deleted Successfully");
        res.redirect("/");
      }
    }

    )


});




//
// let port = process.env.PORT;
// if (port == null || port == "") {
//   port = 3000;
// }

app.listen(3000, function() {
  console.log("Server started on port 3000");
});

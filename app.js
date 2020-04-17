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

//mongoose.connect("mongodb+srv://admin-ramiya:Test123@cluster0-xdeqa.mongodb.net/bookmarkintern", {useNewUrlParser: true});

const itemsSchema = {
  name: String
};

const Item = mongoose.model("Item",itemsSchema);

const item1 = new Item ({

  name: "https://www.nytimes.com/2020/04/14/us/politics/trump-total-authority-claim.html"

});

const item2 = new Item ({

  name: "https://www.google.com/"

});

const item3 = new Item ({

  name: "https://robbishop.house.gov/media/press-releases/house-members-take-cause-liberty"

});

const defaultItems = [item1, item2, item3];

const listSchema = {
  name: String,
  items: [itemsSchema]
};

const List = mongoose.model("List",listSchema);

//INITIAL HOME PAGE WITH THE DEFAULT BOOKMARKS
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

// SPECIFIC TAG WITH THEIR BOOKMARKS PAGE IS RETRIVED
app.get("/:customListName", function(req, res){
  const customListName = req.params.customListName;
  List.find({},function(err,lists){
    List.findOne({name: customListName} , function(err, foundItemsofList){
      if(!err){
        if(!foundItemsofList){
          res.redirect("/"+ customListName);
        }
        else{
          res.render("list",{listTitle: foundItemsofList.name , newListItems: foundItemsofList.items,lists:lists});
        }
      }
      else{
        console.log(err)
      }
    });
  });
});

//Creating the tags to add bookmarks to it
app.post("/createTag",function(req,res){
  var itemName = req.body.newItem;
  var tagName = req.body.newTag;
  const item = new Item({
    name: itemName
  });
  if(tagName.length == 0) //WHEN TO TAGS ARE SEPCIFIED
  {
    Item.findOne({name:itemName}, function(err,lists){
      if(!err){
        if(!lists){
          List.find({"items.name":itemName}, function(err,listsname){
              if(listsname.length==0){
          item.save();
        }
      });
      }
    }
      res.redirect("/");
    });
  }
  else{ //WHEN MULTIPLE TAGS ARE SPECIFIED
    var string = tagName.split(",");
    string.forEach(elements => {
      List.findOne({name: elements} , function(err, foundList){
        if(!err){
          if(!foundList){ //WHEN THE TAG IS NOT FOUND IT IS CREATED AND THEN THE BOOKMARK IS ADDED TO THE TAG
            const list = new List({
              name: elements,
            });
            list.items.push(item);
            list.save();
          }
          else{
            List.find({"items.name":itemName}, function(err,lists){ //IF THE TAG IS ALREADY EXISTING WE CHECK WHETHER THS BOOKMARK IS ALREADY PRESENT TO AVOID DUPLICATE COPY
              if(lists.length == 0){
                foundList.items.push(item);
                foundList.save();
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
  }
});

//RETRIVING ALL BOOKMARKS FROM THE DEFAULT AND FROM TAGS
app.post("/getAllBookmarks",function(req,res){
  List.find({},function(err,lists){
    Item.find({}, function(err,items){
      var itemsName = [];
      if(err)
      {
        console.log(err);
      }
      else{
        items.forEach(function(item){ //BOOKMARKS WITHOUT TAGS
          itemsName.push(item.name);
        });
        lists.forEach(function(list){  //BOOKMARKS WITH TAGS
          list.items.forEach(function(name){
            itemsName.push(name.name);
          });
        });
        res.render("about", {listTitle:"BookMarks",listdata:itemsName});
      }
    });
  });
});

//RETRIVING ALL TAGS
app.post("/getAllTags",function(req,res){
  List.find({},function(err,lists){
    var tagsName = ["Home"];
    if(err)
    {
      console.log(err);
    }
    else{
      lists.forEach(function(list){
        tagsName.push(list.name);
      });
      res.render("about", {listTitle:"TAGS",listdata:tagsName});
    }
  });
});

//DELETING A BOOKMARK FROM A SPECIFIC TAG
app.post("/delete",function(req, res){
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;
  if(listName === "Home Page"){ //DELETING DEFAULT BOOKMARK THOSE WITHOUT TAGS
    Item.findByIdAndRemove(checkedItemId, function(err){
      if(err){
        console.log(err);
      }
      else{
        res.redirect("/");
      }
    });
  }
  else {
    List.findOneAndUpdate( //DELETING BOOKMARKS FROM A TAG
      {name: listName},
      {$pull: {items: {_id:checkedItemId}}},
      function(err, foundList){
        if(!err){
          res.redirect("/"+listName);
        }
      }
    )
  }
});

app.post("/deleteTag",function(req, res){ //REMOVING A
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;
  List.deleteOne(
    {_id: checkedItemId},
    function(err){
      if(!err){
        res.redirect("/");
      }
    }
  )
});

let port = process.env.PORT;
if (port == null || port == "") {
  port = 3000;
}

app.listen(port, function() {
  console.log("Server started on port 3000");
});

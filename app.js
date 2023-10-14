import bodyParser from 'body-parser';
import express from 'express';
import mongoose from 'mongoose';
import _ from 'lodash';

const app = express();
const port = process.env.port || 3000;
var today = '';

const dateToday = (req, res, next) => {
	var options = { weekday: 'long', month: 'long', day: 'numeric' };
	var date = new Date();
	var formatDate = date.toLocaleDateString('en-US', options);
	var data = { date: formatDate };
	today = data.date;
	next();
};

app.set('view engine', 'ejs');
mongoose.set('strictQuery', true)

app.use(dateToday);
app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: true }));

// mongoose.connect('mongodb://127.0.0.1:27017/todolistDB');
mongoose.connect("mongodb+srv://dev:asdf12@cluster0.gjwbtin.mongodb.net/todolistDB?retryWrites=true&w=majority")

const itemsSchema = new mongoose.Schema({
	name: String,
});
const Item = mongoose.model('Item', itemsSchema);

const eat = new Item({
	name: 'Eat',
});
const code = new Item({
	name: 'Code',
});
const sleep = new Item({
	name: 'Sleep',
});

const defaultItems = [];

// Item.insertMany(defaultItems).then((rslt)=>{
// 	console.log(rslt);
// })

const listSchema = new mongoose.Schema({
	name: String,
	items: [itemsSchema],
});

const List = mongoose.model('List', listSchema);

app.get('/', (req, res) => {
	Item.find({}).then((todolist) => {
		res.render('index', {
			todolist: todolist,
			listTitle: 'Today',
			date: today,
		});
	});
});

app.post('/add', (req, res) => {
	const itemName = req.body.newItem;
	const listName = req.body.list;

	const item = new Item({
		name: itemName,
	});

	if (listName === 'Today') {
		item.save();
		res.redirect('/');
	} else {
		List.findOne({ name: listName }).then((foundList) => {
			foundList.items.push(item);
			foundList.save();
			res.redirect('/' + listName);
		});
	}
});

app.get('/:customListName', (req, res) => {
	const customListName = _.capitalize(req.params.customListName);
	List.findOne({ name: customListName }).then((foundList) => {
		if (!foundList) {
			// Create a new List
			const list = new List({
				name: customListName,
				items: defaultItems,
			});
			list.save();
			res.redirect(`/${customListName}`);
		} else {
			// Show an existing List
			res.render('index.ejs', {
				todolist: foundList.items,
				listTitle: foundList.name,
			});
		}
	});
});

// app.post('/work/add', (req, res) => {
// 	worklist.push(req.body.list);
// 	res.redirect("/work");
// });

app.post('/delete', (req, res) => {
	const checkId = req.body.checkbox;
	const listName = req.body.listName;

	if (listName === 'Today') {
		Item.findByIdAndRemove(checkId).then(() => {
			res.redirect('/');
		});
	} else {
		List.findOneAndUpdate(
			{ name: listName },
			{ $pull: { items: { _id: checkId } } }
		).then(() => {
			res.redirect('/' + listName);
		});
	}

	// Item.deleteOne({_id:checkId}).then(()=>{
	// 	res.redirect("/");
	// });
});

app.listen(port, () => {
	console.log(`Listening to port ${port}`);
});

import {Block, Textblock, emptyFragment, Fragment, Attribute, Pos, NodeKind} from "prosemirror/dist/model"
import {elt, insertCSS} from "prosemirror/dist/dom"
import {TextBox} from "./textbox"
import {defParser, defParamsClick, namePattern, nameTitle, selectedNodeAttr, getPosInParent, nodeBefore, insertQuestion} from "../../utils"
import {Question, qclass} from "./question"

const cssi = "widgets-checkitem"
const cssc = "widgets-checklist"
NodeKind.checkitem = new NodeKind("checkitem")

export class CheckItem extends Block {
	static get kind() { return NodeKind.checkitem }
	get attrs() {
		return {
			name: new Attribute({default: ""}),
			value: new Attribute({default: 1}),
			class: new Attribute({default: cssi})
		}
	}
	create(attrs, content, marks) {
		if (content.content) {
			let len = content.content.length
			content = Fragment.from([this.schema.nodes.checkbox.create(attrs),content.content[len-1]])
		}
		return super.create(attrs,content,marks)
	}
}

export class CheckList extends Question {
	get attrs() {
		return {
			name: new Attribute({default: ""}),
			title: new Attribute({default: ""}),
			class: new Attribute({default: cssc + " "+qclass})
		}
	}
	get isList() { return true }
	defaultContent(attrs) {
		let choice_content = Fragment.from([
		    this.schema.nodes.checkbox.create(attrs),
		    this.schema.nodes.textbox.create()
		])
		return Fragment.from([
		    this.schema.nodes.paragraph.create(null,""),
		    this.schema.nodes.checkitem.create(attrs,choice_content)
		])
	}
	create(attrs, content, marks) {
		if (!content) content = this.defaultContent(attrs)
		return super.create(attrs,content,marks)
	}
}

defParser(CheckItem,"div",cssi)
defParser(CheckList,"div",cssc)

CheckItem.prototype.serializeDOM = (node,s) => s.renderAs(node,"div", node.attrs)

function renumber(pm, pos) {
	let cl = pm.doc.path(pos.path), i = 1
	cl.forEach((node,start) => {
		if (node.type.name == "checkitem") {
			pm.tr.setNodeType(new Pos(pos.path,start), node.type, {name: cl.attrs.name+"-"+i, value:i++}).apply()
		}
	})
}

CheckItem.register("command", "split", {
	  label: "Split the current checkitem",
	  run(pm) {
	    let {from, to, node} = pm.selection
	    if ((node && node.isBlock) || from.path.length < 2 || !Pos.samePath(from.path, to.path)) return false
	    let toParent = from.shorten(), parent = pm.doc.path(toParent.path)
	    if (parent.type != this) return false    
	    let tr = pm.tr.delete(from, to).split(from, 2).apply(pm.apply.scroll)
	    renumber(pm, toParent.shorten())
	    return tr
	  },
	  keys: ["Enter(20)"]
	})


CheckItem.register("command", "delete",{
	label: "delete this checkitem or checklist",
	run(pm) {
		let {from,to,head,node} = pm.selection
		if (node && node.type.name == "checklist")
			return pm.tr.delete(from,to).apply(pm.apply.scroll)
		if (node) return false
	    let toCI = from.shorten(), ci = pm.doc.path(toCI.path)
	    if (ci.type != this) return false
		if (from.offset > 0) return pm.tr.delete(from,to).apply(pm.apply.scroll)
	    let toCL = toCI.shorten(), cl = pm.doc.path(toCL.path)
	    let {before,at} = nodeBefore(pm,toCI)
	    // if only question and one choice or still text then ignore
	    if (cl.size == 2 || before.type != this || ci.lastChild.size > 0) return true;
	    let tr = pm.tr.delete(toCL,toCL.move(1)).apply(pm.apply.scroll)
	    renumber(pm, toCL)
	    return tr
	},
	keys: ["Backspace(10)", "Mod-Backspace(10)"]
})

CheckList.register("command", "insert", {
	label: "Check List",
	run(pm, name, title) {
		let {from,to,node} = pm.selection
		let attrs = {name,title}
		if (node && node.type == this) {
			let tr = pm.tr.setNodeType(from, this, attrs).apply()
			renumber(pm,Pos.from(from.toPath().concat(from.offset),0))
			return tr
		} else
			return insertQuestion(pm,from,this.create(attrs))
	},
	select(pm) {
  		return true
	},
	menu: {group: "question", rank: 70, display: {type: "label", label: "CheckList"}},
	params: [
 	    { name: "Name", attr: "name", label: "Short ID", type: "text",
   	  	  prefill: function(pm) { return selectedNodeAttr(pm, this, "name") },
 		  options: {
 			  pattern: namePattern, 
 			  size: 10, 
 			  title: nameTitle}},
   		{ name: "Title", attr: "title", label: "(optional)", type: "text", default: "",
       	  prefill: function(pm) { return selectedNodeAttr(pm, this, "title") },
     	  options: {
       		required: '' 
       	}}
	]
})

defParamsClick(CheckList,"checklist:insert")

insertCSS(`

.ProseMirror .${cssi} {
	cursor: text;
}

.ProseMirror .${cssi} input {
	float: left;
}


`)
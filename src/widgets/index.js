export {Input, TextBox, CheckBox, RadioButton, CheckList, CheckItem, ChoiceList, Choice, Scale, Select, Essay, ShortAnswer} from "./answertypes"
export {BlockMath,CarryForward,Image,InlineMath,SpreadSheet,Website} from "./contenttypes"
import {insertCSS} from "prosemirror/dist/dom"

insertCSS(`

.ProseMirror .widgets-edit:hover {
	background-image: url('icons/settings.png');
	background-repeat: no-repeat;
	background-position: top left;
	cursor: pointer;
 }

`)









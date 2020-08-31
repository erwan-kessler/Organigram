// es5 compliant see babel
"use strict";

var possible_hyper_parameters = ["children"];
var possible_parameters = [
    "color",
    "orientation",
    "floating",
    "style",
    "childrenBorder"
];
var possible_node_simple_decl = ["statut", "nom", "fonction", "link"];
var possible_node_multiple_decl = ["noms", "fonctions", "links"];

function entrypoint(id) {
    var datasource = build_hierarchy(id);

    if (datasource == null) {
        console.error("Fail to pass semantics checks");
        return null;
    }

    return datasource;
}

function build_hierarchy(id) {
    var parser = parse_pre_block(id);

    if (parser == null) {
        console.error("Fail to parse pre block");
        return null;
    }

    var arr = parser[0];

    if (arr == null) {
        console.error("Fail to parse pre block");
        return null;
    }

    var res = check_hierarchy_top_level(arr, 0, {});

    if (res == null) {
        console.error("Semantics check failed");
        return null;
    }

    return res;
}

function check_hierarchy_top_level(arr) {
    var nodes = [];
    var params = [];
    var result = {};

    if (arr.length !== 2) {
        console.error("Impossible case for first level: ");
        console.log(arr);
        return null;
    }

    if (typeof arr[0] !== "string") {
        console.error(
            "Error, the first instance should always be of type string: "
        );
        console.log(arr[0]);
        return null;
    }

    var entry = arr[0];

    if (!Array.isArray(arr[1])) {
        console.error(
            "Error, the second instance should always be of type array: "
        );
        console.log(arr + " " + arr[1]);
        return null;
    }

    for (var i = 0; i < arr[1].length; i++) {
        var field = arr[1][i];

        if (typeof field[0] === "string") {
            if (typeof field[1] === "string") {
                if (possible_parameters.indexOf(field[0]) === -1) {
                    console.error(
                        "The parameter is not valid, only those are valid: " +
                        possible_parameters
                    );
                    return null;
                }

                params.push({
                    type: field[0],
                    value: field[1]
                });
            } else if (Array.isArray(field[1])) {
                if (possible_hyper_parameters.indexOf(field[0]) === -1) {
                    console.error(
                        "The hyper parameter is not valid, only those are valid: " +
                        possible_hyper_parameters +
                        " got " +
                        field[0]
                    );
                    return null;
                }

                field[1].forEach(function (children) {
                    let res = check_hierarchy_top_level(children);

                    if (res == null) {
                        console.error("Failed top level");
                        return null;
                    }

                    if (result["children"] == null) {
                        result["children"] = [res];
                    } else {
                        result["children"].push(res);
                    }
                });
            } else {
                console.error(
                    "The second field is not of a known type and will be treated as an error: " +
                    field[1]
                );
                return null;
            }
        } else if (Array.isArray(field[0])) {
            (function () {
                // check if first element is array
                var final_node = {};
                field.forEach(function (element) {
                    if (typeof element[0] !== "string") {
                        console.error(
                            "Using a non string identifier in a block is not valid"
                        );
                        console.log(element);
                        return null;
                    }

                    if (possible_node_simple_decl.indexOf(element[0]) > -1) {
                        if (typeof element[1] === "string") {
                            final_node[element[0]] = element[1];
                        } else {
                            console.error("Not a valid simple decl value ");
                            console.log(element);
                            return null;
                        }
                    } else if (possible_node_multiple_decl.indexOf(element[0]) > -1) {
                        if (Array.isArray(element[1])) {
                            final_node[element[0]] = element[1];
                        } else {
                            console.error("Not a valid multiple decl value ");
                            console.log(element);
                            return null;
                        }
                    } else {
                        console.error("Not a valid decl: ");
                        console.log(element);
                        return null;
                    }
                });
                nodes.push(final_node);
            })();
        } else {
            console.error(
                "The first field is not of a known type and will be treated as an error: " +
                field[0]
            );
            return null;
        }
    }

    if (nodes.length === 0 && params.length === 0 && name === "") {
        result["data"] = null;
        result["className"] = "line-node";
    } else {
        result["data"] = {
            name: entry,
            params: params,
            nodes: nodes
        };

        for (let i = 0; i < params.length; i++) {
            if (params[i].type === "floating") {
                result["className"] = "floating";
            }
        }
    }

    return result;
}

function buildNode(data) {
    data = data["data"];

    if (data == null) {
        return null;
    }

    if (data.nodes.length === 0) {
        return null;
    }

    var node = document.createElement("div");
    node.classList.add("organigram-parent-node"); // add the params

    node = add_params(node, data.params); // add the title

    var title = document.createElement("div");
    title.classList.add("organigram-title");
    title.textContent = data.name;
    node.appendChild(title); // add the nodes

    var nodes = document.createElement("div");

    if (data.nodes.length > 1) {
        nodes.classList.add("organigram-nodes");
    } else {
        nodes.classList.add("organigram-node");
    }

    nodes = add_nodes(nodes, data.nodes);
    node.appendChild(nodes);
    return node;
}

var id = 0;

function modifyNode($node, data) {
    if (data && data.className === "floating") {
        var node_id = "chart" + id;
        $node[0].id = node_id;
        $node[0].style.position = "absolute";
        var checkExist = setInterval(function () {
            if (document.getElementById(node_id)) {
                clearInterval(checkExist);
                var node = document.getElementById(node_id);
                var level = node.parentElement.parentElement.parentElement.parentElement.parentElement.childNodes;
                var offset = 0;
                var right = node.childNodes[0].classList.contains("floating-right");
                var current = 0;

                for (let i = 0; i < level.length; i++) {
                    var current_node = level[i];

                    for (var j = 0; j < 5; j++) {
                        if (current_node.childNodes) {
                            current_node = current_node.childNodes[0];
                        }
                    }

                    if (current_node) {
                        if (right) {
                            if (current_node.classList.contains("floating-right")) {
                                offset++;
                            }
                        } else {
                            if (current_node.classList.contains("floating-left")) {
                                offset++;
                            }
                        }

                        if (current_node.parentElement.id === node_id) {
                            current = offset;
                        }
                    }
                }

                var available_width = document.getElementById("chart-container").offsetWidth;
                console.log(available_width)
                var transform_matrix = window.getComputedStyle(
                        document.getElementsByClassName("orgchart")[0],
                        null
                    ).getPropertyValue("transform");
                var values = transform_matrix.match(/-?\d+\.?\d*/g).map((x) => +x);
                var node_width = available_width / 2 / (values[0] + 0.15);
                node.style.width = node_width + "px";

                if (right) {
                    node.style.right = "21px";

                    if (values[0] !== 1) {
                        node.style.right = "0";
                        node.style.transformOrigin = "top left";
                        node.style.transform =
                            "translateX(" +
                            (available_width / 2 - node_width / 2 - 10) +
                            "px)";
                    }
                } else {
                    node.style.left = "21px";
                }

                if (current !== 1) {
                    node.style.top = 250 + "px";
                }

                node.style.height = 200 / offset + "px"; // remove line
                var lines = node.parentElement.parentElement.parentElement.parentElement.parentElement.parentElement.childNodes;

                for (let i = 0; i < lines.length; i++) {
                    var line = lines[i];

                    if (line.classList.contains("lines")) {
                        line.style.display = "none";
                    }
                }
            }
        }, 100);
        id++;
    }
}
function fill_array_from_partial(arr,elem,len){
    var res = [];
    if (arr) {
        if (arr.length < len) {
            if (arr.length === 1) {
                res = Array.apply(null, Array(len)).map(function () {
                    return arr[0];
                });
            } else {
                for (let j = 0; j < arr.length; j++) {
                    res[j] = arr[j];
                }

                for (let j =arr.length; j < len; j++) {
                    res[j] = "";
                }
            }
        } else {
            res = arr.slice(0, len);
        }
    } else if (elem) {
        res = Array.apply(null, Array(len)).map(function () {
            return elem;
        });
    } else {
        res = Array.apply(null, Array(len)).map(function () {
            return "";
        });
    }
    return res;
}
function add_nodes(parent, nodes) {
    for (var i = 0; i < nodes.length; i++) {
        var node = nodes[i];
        var outer_node = document.createElement("div");
        outer_node.classList.add("organigram-outer-node");
        var statut = document.createElement("div");
        statut.classList.add("organigram-statut");
        outer_node.appendChild(statut);

        if (node.statut) {
            outer_node.textContent = node.statut;
        }

        var inner_node = document.createElement("div");
        inner_node.classList.add("organigram-inner-node");
        outer_node.appendChild(inner_node);

        if (node.noms) {
            var noms = node.noms;
            var fonctions=fill_array_from_partial(node.fonctions,node.fonction,noms.length)
            var links=fill_array_from_partial(node.links,node.link,noms.length)


            for (let j = 0; j < noms.length; j++) {
                var nds = document.createElement("div");
                nds.classList.add("organigram-inside-node");
                nds.classList.add("organigram-node-nom");
                var lnks=document.createElement("a");
                lnks.href=links[j];
                lnks.textContent = noms[j] + (fonctions[j] && fonctions[j] !== "" ? " (" + fonctions[j] + ")" : "");
                nds.appendChild(lnks);
                inner_node.appendChild(nds);
            }
        } else {
            var nom = node.nom ? node.nom : "";
            var fonction = "";
            var link = "";

            if (node.fonctions) {
                fonction = node.fonctions[0];
            } else {
                fonction = node.fonction ? node.fonction : "";
            }
            if (node.links) {
                link = node.links[0];
            } else {
                link = node.link ? node.link : "";
            }

            var outer = document.createElement("div");
            outer.classList.add("organigram-inside-node");
            outer.classList.add("organigram-node-nom");
            var lnk=document.createElement("a");
            lnk.href=link;
            lnk.textContent = nom;
            outer.appendChild(lnk);
            inner_node.appendChild(outer);
            var nd = document.createElement("div");
            nd.classList.add("organigram-inside-node");
            nd.classList.add("organigram-node-fonction");
            nd.textContent = fonction;
            inner_node.appendChild(nd);
        }

        parent.appendChild(outer_node);
    }

    return parent;
}

function add_params(node, params) {
    for (var i = 0; i < params.length; i++) {
        var param = params[i];

        switch (param.type) {
            case "color":
                node.style.backgroundColor = param.value;
                break;

            case "orientation":
                if (param.value === "grid") {
                    node.classList.add("organigram-grid");
                } else if (param.value === "column") {
                    node.classList.add("organigram-column");
                } // by default its row

                break;

            case "floating":
                node.classList.add("floating-" + param.value);
                break;

            case "style":
                node.style.cssText = param.value;
                break;

            case "childrenBorder":
                if (param.value === "false") {
                    node.classList.add("organigram-no-children-border");
                }

                break;

            default:
                break;
        }
    }

    return node;
}

function parse_pre_block(id) {
    var pre_block = document.getElementById(id);

    if (pre_block == null) {
        pre_block = document.getElementsByTagName("pre")[0];
    }

    if (pre_block == null || pre_block.childElementCount === 0) {
        return null;
    }

    pre_block.id = "code";
    var children = pre_block.childNodes;
    var res = "";

    for (var i = 0; i < children.length; i++) {
        var child = children[i];

        if (child.nodeType === 3) {
            // text node
            res += child.data.replace(/\\\*.*(?=\*\\)\*\\/g, "");
        }
    }

    res = res.replace(/\/\*.*?(?=\*\/)\*\//g, "");
    var final = "";
    var removeSpaces = true;

    for (var _i = 0; _i < res.length; _i++) {
        var char = res[_i];

        if (char === '"') {
            removeSpaces = !removeSpaces;
        }

        if (removeSpaces) {
            if (char !== " ") {
                final += char;
            }
        } else {
            final += char;
        }
    }

    var result = parse_block(final, 0);

    if (result == null) {
        return null;
    }

    return result[0];
} // final grammar, remove all whitespace (except in text before)
// block= '{' decl (',' decl)* ','? '}'
// decl= (text ':' ( text | array | block )) | block
// array= '[' text (',' text)* ','? ']'
// text='"' .*? '"'

function parse_block(string, index) {
    if (string[index] !== "{") {
        console.error("Error on outer block, missing first bracket");
        console.log(string.slice(index, index + 10));
        return null;
    }

    index++;
    var acc = [];

    while (true) {
        var decl_r = void 0;
        decl_r = parse_decl(string, index);

        if (decl_r === null) {
            console.error("Error on decl");
            console.log(string.slice(index, index + 10));
            return null;
        }

        var decl = decl_r[0];
        acc.push(decl);
        index = decl_r[1];

        if (string[index] === ",") {
            index++;

            if (string[index] === "}") {
                // this is to accommodate for a trailing comma
                break;
            }

            continue;
        }

        break;
    }

    if (string[index] !== "}") {
        console.error("Error on outer block, missing last bracket");
        console.log(string.slice(index - 10, index));
        return null;
    }

    index++;
    return [acc, index];
}

function parse_decl(string, index) {
    if (string[index] === "{") {
        //standalone block
        var res = parse_block(string, index);

        if (res == null) {
            console.error("error on parsing block");
            console.log(string.slice(index, index + 10));
            return null;
        }

        return [res[0], res[1]];
    }

    var text_r = parse_text(string, index);

    if (text_r === null) {
        console.error("Error on text in decl");
        console.log(string.slice(index, index + 10));
        return null;
    }

    var text = text_r[0];
    index = text_r[1];

    if (string[index] !== ":") {
        console.error("Error on outer block, missing colon");
        console.log(string.slice(index, index + 10));
        return null;
    }

    index++;

    if (string[index] === "[") {
        index++;
        var acc = [];

        while (true) {
            var _text_r = parse_text(string, index);

            if (_text_r === null) {
                console.error("Error on text");
                console.log(string.slice(index, index + 10));
                return null;
            }

            var text_array = _text_r[0];
            acc.push(text_array);
            index = _text_r[1];

            if (string[index] === ",") {
                index++;

                if (string[index] === "}") {
                    //this is to accommodate for trailing comma
                    break;
                }

                continue;
            }

            break;
        }

        if (string[index] !== "]") {
            console.error("Wrongfully terminated array");
            console.log(string.slice(index - 10, index));
            return null;
        }

        index++;
        return [[text, acc], index];
    } else if (string[index] === "{") {
        var _res = parse_block(string, index);

        if (_res == null) {
            console.error("Error on parsing block");
            console.log(string.slice(index, index + 10));
            return null;
        }

        return [[text, _res[0]], _res[1]];
    } else {
        var _text_r2 = parse_text(string, index);

        if (_text_r2 == null) {
            console.error("Error on parsing text");
            console.log(string.slice(index, index + 10));
            return null;
        }

        return [[text, _text_r2[0]], _text_r2[1]];
    }
}

function parse_text(string, index) {
    if (string[index] !== '"') {
        console.error("Error on parsing text");
        console.log(string.slice(index, index + 10));
        return null;
    }

    index++;
    var acc = "";

    while (index < string.length) {
        if (string[index] === '"') {
            return [acc, index + 1];
        }

        acc += string[index];
        index++;
    }

    return null;
}

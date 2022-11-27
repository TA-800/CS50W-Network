// source: https://stackoverflow.com/questions/6234773/can-i-escape-html-special-chars-in-javascript

/*
function escapeHTML(unsafe)
{
    return unsafe
         .replace(/&/g, "&amp;")
         .replace(/</g, "&lt;")
         .replace(/>/g, "&gt;")
         .replace(/"/g, "&quot;")
         .replace(/'/g, "&#039;");
 }
 function unescapeHTML(safe)
{
    return safe
        .replace(/&amp;/g, "&")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&quot;/g, '"')
        .replace(/&#039;/g, "'");
 }*/

function submit_post() {
    console.log("Submit post called on post with content: " + document.querySelector("#new_post_textarea").value);

    fetch("", {
            method: "POST",
            credentials: "same-origin",
            headers: {
                "X-CSRFToken": document.querySelector('[name=csrfmiddlewaretoken]').value,
            },
            body: JSON.stringify({
                action: "submit_post",
                content: document.querySelector("#new_post_textarea").value
            })
        })
    .then(response => response.json())
    .then(result => {
        if (result["msg"] == "empty") {
            alert("Post cannot be empty");
            // clear textarea
            document.querySelector("#new_post_textarea").value = "";
        } else if (result["msg"] == "posted") {
            // reload page
            console.log("Post submitted successfully");
            // clear textarea
            document.querySelector("#new_post_textarea").value = "";
            window.location.reload();
        }
    });
}

function delete_post(object) {
    object = object.parentElement.parentElement.parentElement.parentElement;
    console.log("Delete post function called on post with content:\n" + object.children[1].children[1].innerHTML);
    fetch("", {
        method: "POST",
        credentials: "same-origin",
        headers: {
            "X-CSRFToken": document.querySelector('[name=csrfmiddlewaretoken]').value,
        },
        body: JSON.stringify({
            action: "delete_post",
            post_id: object.dataset.id
        })
    })
    .then(response => response.json())
    .then(result => {
        if (result["msg"] == "undeleted") {
            console.log("Post not deleted");
        } else if (result["msg"] == "deleted") {
            console.log("Post deleted successfully");
            // Change object's animation state from paused to running
            object.style.animationPlayState = "running";
            // Remove object after animation is done
            object.addEventListener("animationend", () => {
                object.remove();
            });
        }
    });
}

function edit_post(object) {
    // object is the edit button, we need to get the post container (that contains the entire post info e.g. text, author, etc.)
    // post container
    object = object.parentElement.parentElement.parentElement.parentElement;
    // Save object innerHTML in case user cancels edit
    let temp = object.innerHTML;
    
    // Changing the id of the post container to edit_post_container
    // This is now the object to which the edit_post_HTML React component will be attached to
    object.id = "edit_post_Container";

    function edit_post_HTML(temp, object) {
        return (
            <div id="edit_post_container">
                <div id="edit_post_textarea_div">
                    <textarea class="form-control" id="edit_post_textarea" defaultValue={object.querySelector("#post_text").innerText} rows="4" cols="110"></textarea>
                </div>
                <div id="edit_post_buttons">
                    <button id="edit_post_submit_btn" className="btn btn-outline-primary" onClick={()=> {
                        edit_post_submit(temp, object);
                    }}>Submit</button>
                    <button id="edit_post_cancel_btn" className="btn btn-outline-danger" onClick={() => {
                        edit_post_cancel(temp, object);
                    }}>Cancel</button>
                </div>
            </div>
        );
    }
    
    function edit_post_submit(temp, object) {
        console.log("Edit post submit called");
        let new_post_content = object.querySelector("#edit_post_textarea").value;
    
        //object.querySelector("#edit_post_textarea").value;
        fetch("", {
            method: "POST",
            credentials: "same-origin",
            headers: {
                "X-CSRFToken": document.querySelector('[name=csrfmiddlewaretoken]').value,
            },
            body: JSON.stringify({
                action: "edit_post",
                post_id: object.dataset.id,
                new_content: new_post_content
            })
        })
        .then(response => response.json())
        .then(result => {
            if (result["msg"] == "empty") {
                alert("Post cannot be empty");
            } else if (result["msg"] == "unedited") {
                console.log("Post could not be edited");
            } else if (result["msg"] == "edited") {
                console.log("Post edited successfully");
                // reverse changes made to object
                edit_post_cancel(temp, object);
                // once changes are reversed, add the final change
                // the final change is to change the post text to the new text
                object.querySelector("#post_text").innerHTML = new_post_content
            }
        });
    }

    function edit_post_cancel(temp, object) {
        console.log("Edit post cancel called");
    
        // Reverse changes made to object
        // Change id back to post_container
        object.id = "post_container";
    
        // Remove edit_post_HTML React component
        ReactDOM.unmountComponentAtNode(object);
    
        // Change innerHTML back to temp so that we get the original post back
        object.innerHTML = temp;
    
        // Since we added event listeners through JS, we need to add them again since they are not part of innerHTML
        object.querySelector("#edit_post_button").addEventListener("click", () => edit_post(object.querySelector("#edit_post_button")));
        object.querySelector("#delete_post_button").addEventListener("click", () => delete_post(object.querySelector("#delete_post_button")));
    }

    // Call render
    ReactDOM.render(edit_post_HTML(temp, object), object)
}

// React functions vs JS functions: https://stackoverflow.com/questions/70629313/difference-between-regular-javascript-functions-and-react-functions
// React functions must be capitalized, take a single argument (props), return valid JSX, and can never be invoked directly (only referenced e.g. <LikeButton name="Alice"/>)
// Hooks can only be called from within React functions
function post_mdata(object) {
    
    object = object.parentElement;

    function PostDataHTML(props) {
        const [state, setState] = React.useState(() => {
            //console.log("useState called");
            return {
            likes: Number(props.likes),
            dislikes: Number(props.dislikes),
            liked: props.liked,
            disliked: props.disliked
            }}
        );

        function like_post() {
            // We still have access to the object variable from the outer scope
            //console.log("Liked post on object id: " + object.dataset.id);

            
            fetch("", {
                method: "POST",
                credentials: "same-origin",
                headers: {
                    "X-CSRFToken": document.querySelector('[name=csrfmiddlewaretoken]').value,
                },
                body: JSON.stringify({
                    action: "like_post",
                    post_id: object.dataset.id
                })
            })
            .then(response => response.json())
            .then(result => {
                if (result["msg"] == "liked") {
                    console.log("Backend returned liked");
                    // setState passes the previous state as an argument to the function
                    // the function returns the new state
                    setState(prevState => {
                        //console.log("like setState called");
                        // print previous state to console for debugging in a more readable format
                        console.log("Previous state: " + JSON.stringify(prevState, null, 4));
                        return {
                        ...prevState,
                        likes: prevState.liked ? prevState.likes - 1 : prevState.likes + 1,
                        dislikes : prevState.disliked ? prevState.dislikes - 1 : prevState.dislikes,
                        liked: !prevState.liked,
                        disliked: false
                    }});
                }
            });

        }

        function dislike_post() {
            //console.log("Disliked post on object id: " + object.dataset.id);

            fetch("", {
                method: "POST",
                credentials: "same-origin",
                headers: {
                    "X-CSRFToken": document.querySelector('[name=csrfmiddlewaretoken]').value,
                },
                body: JSON.stringify({
                    action: "dislike_post",
                    post_id: object.dataset.id
                })
            })
            .then(response => response.json())
            .then(result => {
                if (result["msg"] == "disliked") {
                    console.log("Backend returned disliked");
                    setState(prevState => { 
                        //console.log("dislike setState called");
                        // print previous state to console for debugging in a more readable format
                        console.log("Previous state: " + JSON.stringify(prevState, null, 4));
                        return {
                            ...prevState,
                            dislikes: prevState.disliked ? prevState.dislikes - 1 : prevState.dislikes + 1,
                            likes: prevState.liked ? prevState.likes - 1 : prevState.likes,
                            disliked: !prevState.disliked,
                            liked: false
                    }});
                }
            });

        }

        return (
            <div id="post_metadata">
                <div id={state.liked ? "liked" : "default"} onClick={() => like_post()}>
                    <i className="fa fa-thumbs-up"></i>
                </div>
                <div id="likes_count">{state.likes - state.dislikes}</div>
                <div id={state.disliked ? "disliked" : "default"} onClick={() => dislike_post()}>
                    <i className="fa fa-thumbs-down"></i>
                </div>
            </div>
        );
    }
    
    let lkd = false, dlkd = false;
    if (object.dataset.liked == 1) {
        lkd = true;
        dlkd = false;
    } else if (object.dataset.liked == 0) {
        lkd = false;
        dlkd = false;
    } else if (object.dataset.liked == -1) {
        lkd = false;
        dlkd = true;
    }

    // Render post_mdata_HTML React component to object's post_mdata div
    // Remember that post_mdata div will contain another singular div that will contain the React component
    ReactDOM.render(
        <PostDataHTML likes={object.dataset.likes} dislikes={object.dataset.dislikes} liked={lkd} disliked={dlkd}/>, object.querySelector("#post_Metadata_signedin")
    );

};


document.querySelector("#new_post_button").addEventListener("click", () => submit_post());
document.querySelectorAll("#edit_post_button").forEach(button => button.addEventListener("click", () => edit_post(button)));
document.querySelectorAll("#delete_post_button").forEach(button => button.addEventListener("click", () => delete_post(button)));
document.querySelectorAll("#post_Metadata_signedin").forEach(object => post_mdata(object));
document.querySelectorAll("#comments_button").forEach(object => object.addEventListener("click", () => {
    window.location.href = `/post/${object.closest("#post_container").dataset.id}/comments`;
}));
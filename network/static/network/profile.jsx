/*
Code of this is mostly the same as index.jsx
The reason to copy-paste the code instead of importing it is because current set up of React/JSX does not allow for importing
    since it is already type="text/babel" and importing would require type="module"
*/
let profileUser = "";

function post_mdata(object) {
    
    object = object.parentElement;
    if (profileUser == "") {
    profileUser = object.getAttribute("data-profileUser");
    }

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

            fetch(`${profileUser}`, {
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

            fetch(`${profileUser}`, {
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

}

function delete_post(object) {
    object = object.parentElement.parentElement.parentElement.parentElement;
    //console.log("Delete post function called on post with content:\n" + object.children[1].children[1].innerHTML);
    
    fetch(`${profileUser}`, {
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
        fetch(`${profileUser}`, {
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

function follow() {
    console.log("Follow function called");
    // Get follow button
    let follow_btn = document.querySelector("#follow_button");
    
    fetch(`${profileUser}`, {
        method: "POST",
        credentials: "same-origin",
        headers: {
            "X-CSRFToken": document.querySelector('[name=csrfmiddlewaretoken]').value,
        },
        body: JSON.stringify({
            action: "follow" // though the action is follow, the backend will check if the action is unfollow or follow
            // No need to send the profileUser variable since we are already fetching from that URL which contains the profileUser username
        })
    })
    .then(response => response.json())
    .then(result => {
        if (result["msg"] == "followed") {
            console.log("Followed successfully");
            // Change follow button text to unfollow
            follow_btn.innerText = "Unfollow";
        }
         else if (result["msg"] == "unfollowed") {
            console.log("Unfollowed successfully");
            // Change follow button text to follow
            follow_btn.innerText = "Follow";
        }
    });
}

document.querySelectorAll("#post_Metadata_signedin").forEach(object => post_mdata(object));
document.querySelectorAll("#edit_post_button").forEach(button => button.addEventListener("click", () => edit_post(button)));
document.querySelectorAll("#delete_post_button").forEach(button => button.addEventListener("click", () => delete_post(button)));
document.querySelector("#follow_button").addEventListener("click", () => follow());
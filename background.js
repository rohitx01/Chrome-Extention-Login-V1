// Register the service worker
chrome.runtime.onInstalled.addListener(() => {
  console.log("Service worker installed.");
});

let user_signed_in = false;

chrome.action.onClicked.addListener(function () {
  if (!user_signed_in) {
    chrome.windows.create({
      url: "./popup-sign-in.html",
      width: 600,
      height: 800,
      focused: true,
    });
  } else {
    chrome.windows.create({
      url: "./popup-sign-out.html",
      width: 600,
      height: 800,
      focused: true,
    });
  }
});

// function openPopupWindow(url, width, height) {
//   const left = (screen.width - width) / 2;
//   const top = (screen.height - height) / 2;

//   chrome.windows.create({
//     url: "./popup-sign-in.html",
//     width: 600,
//     height: 800,
//     left: left,
//     top: top,
//     type: "popup",
//   });
// }

function flip_user_status(signIn, user_info) {
  if (signIn) {
    return fetch("http://localhost:3000/login", {
      method: "GET",
      headers: {
        Authorization: "Basic " + btoa(`${user_info.email}:${user_info.pass}`),
      },
    })
      .then((res) => {
        return new Promise((resolve) => {
          if (res.status !== 200) resolve("fail");

          chrome.storage.local.set(
            { userStatus: signIn, user_info },
            function () {
              if (chrome.runtime.lastError) resolve("fail");

              user_signed_in = signIn;
              resolve("success");
            }
          );
        });
      })
      .catch((err) => console.log(err));
  } else if (!signIn) {
    return new Promise((resolve) => {
      chrome.storage.local.get(
        ["userStatus", "user_info"],
        function (response) {
          if (chrome.runtime.lastError) resolve("fail");

          if (response.userStatus === undefined) resolve("fail");

          fetch("http://localhost:3000/logout", {
            method: "GET",
            headers: {
              Authorization:
                "Basic " +
                btoa(`${response.user_info.email}:${response.user_info.pass}`),
            },
          })
            .then((res) => {
              if (res.status !== 200) resolve("fail");

              chrome.storage.local.set(
                { userStatus: signIn, user_info: {} },
                function () {
                  if (chrome.runtime.lastError) resolve("fail");

                  user_signed_in = signIn;
                  resolve("success");
                }
              );
            })

            .catch((err) => console.log(err));
        }
      );
    });
  }
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.message === "login") {
    flip_user_status(true, request.payload)
      .then((res) => sendResponse(res))
      .catch((err) => console.log(err));

    return true;
  } else if (request.message === "logout") {
    flip_user_status(true, null)
      .then((res) => sendResponse(res))
      .catch((err) => console.log(err));

    return true;
  }
});

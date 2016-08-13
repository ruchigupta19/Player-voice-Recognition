function allowAccessToMicrophone() {
    document.getElementById('allowChat').src='chat-icon.png';
    videojs('player').voiceDev();
}

videojs.plugin('voiceDev', function () {
    var SpeechRecognition = SpeechRecognition || webkitSpeechRecognition;
    var player = this;
    var contentRecog = document.getElementById("contentRecog");
    if (document.getElementById('resultsDiv')) {
        document.getElementById('resultsDiv').remove();
    }

    var results = document.createElement('div');
    results.setAttribute('id', 'resultsDiv');

    var status = document.createElement('div');
    status.innerHTML = 'Not Listening.';
    results.appendChild(status);

    var speechResult = document.createElement("div");
    speechResult.innerHTML = '';
    speechResult.className = "speech";
    results.appendChild(speechResult);

    contentRecog.appendChild(results);

    var alternativesDebug = document.createElement("div");
    alternativesDebug.innerHTML = '';
    alternativesDebug.className = "alternatives";
    document.body.appendChild(alternativesDebug);

    if (!SpeechRecognition) {
        status.innerHTML = "No Speech Capabilities Found";
    } else {
        var recognition = new SpeechRecognition();
        recognition.lang = 'en-US';
        recognition.interimResults = false;
        recognition.continuous = true;
        recognition.maxAlternatives = 1;
        var isShareScreenOpen = false;

        document.getElementById("disable").onclick = function () {
            document.getElementById('allowChat').src='chat.png';
            recognition.stop();
            status.innerHTML = 'No Longer Listening.';
        }

        recognition.onnomatch = function (event) {
            console.log("Did not recognize");
        };

        recognition.onstart = function () {
            status.className = "status";
            status.innerHTML = "Listening......";
        };

        recognition.onresult = function (event) {
            for (var i = event.resultIndex; i < event.results.length; ++i) {
                var result = event.results[i];

                if (result.isFinal) {
                    speechResult.innerHTML = "Speech Result (final): " + result[0].transcript;
                } else {
                    speechResult.innerHTML = "Speech Result (in progress): " + result[0].transcript;
                }

                for (var k = 0; k < result.length; ++k) {
                    var command = result[k].transcript;
                    if (command.match(/(play|(?:^|\W)start(?:$|\W))/)) {
                        if(player.paused()) {
                            var index = player.playlist.currentItem();
                            var playlistObj = player.playlist();
                            player.play();
                            var utterance = new SpeechSynthesisUtterance("Video" + playlistObj[index].name + "has been started");
                            window.speechSynthesis.speak(utterance);
                        }
                    } else if (command.match(/(pause|(?:^|\W)stop(?:$|\W))/)) {
                        if(!player.paused()) {
                            player.pause();
                            var index = player.playlist.currentItem();
                            var playlistObj = player.playlist();
                            var utteranceStop = new SpeechSynthesisUtterance("Video" + playlistObj[index].name + "has been stopped");
                            window.speechSynthesis.speak(utteranceStop);
                        }
                    } else if (command.match(/(jump to [0-9]*|seek [0-9]*|jump [0-9]*)/)) {
                        var number = command.replace(/[^\d]/g, '');
                        if (number <= player.duration()) {
                            player.currentTime(number);
                            var utteranceSeek = new SpeechSynthesisUtterance("Video has been seeked to " + number + " seconds");
                            window.speechSynthesis.speak(utteranceSeek);
                        }
                    } else if (command.match(/(?:^|\W)next(?:$|\W)/)) {
                        var playlistObj = player.playlist.next();
                        var utteranceNext = new SpeechSynthesisUtterance("next " + playlistObj.name + "video is playing");
                        window.speechSynthesis.speak(utteranceNext);
                    } else if (command.match(/(?:^|\W)previous(?:$|\W)/)) {
                        var playlistObj = player.playlist.previous();
                        var utterancePrev = new SpeechSynthesisUtterance("Previous video " + playlistObj.name + "is playing");
                        window.speechSynthesis.speak(utterancePrev);
                    } else if (command.match(/(increase volume|volume up|raise volume)/)) {
                        var v = player.volume();
                        if (v < 1) {
                            player.volume(v + 0.2);
                        }
                    } else if (command.match(/(decrease volume|volume down)/i)) {
                        var v = player.volume();
                        if (v > 0) {
                            player.volume(v - 0.3);
                        }
                    } else if (command.match(/(unmute)/i)) {
                        player.muted(false);
                    } else if (command.match(/(mute)/i)) {
                        player.muted(true);
                    } else if (command.match(/(exit full-screen)/)) {
                        player.exitFullscreen();
                    } else if (command.match(/(share my video|share video|share)/i)) {
                        document.getElementsByClassName("vjs-share-control")[0].click();
                        var label = document.getElementsByClassName("vjs-social-direct-link")[0];
                        var input = label.getElementsByTagName("input")[0];
                        input.value = "https://studio.brightcove.com/products/videocloud/players/players/" + document.getElementById("player").getAttribute("data-player");
                        input.setAttribute("readonly", "false");
                        isShareScreenOpen = true;
                    } else if (isShareScreenOpen && command.match(/(share video on facebook|on facebook|facebook)/i)) {
                        var url = getShareVideoUrl(player);
                        var isAllowed = isSharingAllowed("facebook");
                        if (isAllowed) {
                            window.open("https://www.facebook.com/sharer/sharer.php?u=" + url);
                        } else {
                            var utteranceFb = new SpeechSynthesisUtterance("Player is not configured to share video on facebook.");
                            window.speechSynthesis.speak(utteranceFb);
                        }
                        isAllowed = false;
                    } else if (isShareScreenOpen && command.match(/(share video on google plus|on google|on google plus|google plus)/i)) {
                        var url = getShareVideoUrl(player);
                        var isAllowed = isSharingAllowed("google");
                        if (isAllowed) {
                            window.open("https://plus.google.com/share?url=" + url);
                        } else {
                            var utteranceG = new SpeechSynthesisUtterance("Player is not configured to share video on google plus.");
                            window.speechSynthesis.speak(utteranceG);
                        }
                        isAllowed = false;
                    } else if (isShareScreenOpen && command.match(/(share video on twitter|on twitter|twitter)/i)) {
                        var url = getShareVideoUrl(player);
                        var isAllowed = isSharingAllowed("twitter");
                        if (isAllowed) {
                            window.open("https://twitter.com/intent/tweet?original_referer=https://about.twitter.com/resources/buttons&tw_p=tweetbutton&url=" + url);
                        } else {
                            var utteranceT = new SpeechSynthesisUtterance("Player is not configured to share video on twitter.");
                            window.speechSynthesis.speak(utteranceT);
                        }
                        isAllowed = false;
                    } else if (isShareScreenOpen && command.match(/(share video on pinterest|on pinterest|pinterest)/i)) {
                        var url = getShareVideoUrl(player);
                        var isAllowed = isSharingAllowed("pinterest");
                        if (isAllowed) {
                            window.open("https://pinterest.com/pin/create/button/?url=" + url);
                        } else {
                            var utteranceP = new SpeechSynthesisUtterance("Player is not configured to share video on pinterest.");
                            window.speechSynthesis.speak(utteranceP);
                        }
                        isAllowed = false;
                    } else if (isShareScreenOpen && command.match(/(share video on tumblr|on tumblr|tumblr)/i)) {
                        var url = getShareVideoUrl(player);
                        var isAllowed = isSharingAllowed("tumblr");
                        if (isAllowed) {
                            window.open("http://www.tumblr.com/share?v=3&u=" + url);
                        } else {
                            var utteranceTumblr = new SpeechSynthesisUtterance("Player is not configured to share video on tumblr.");
                            window.speechSynthesis.speak(utteranceTumblr);
                        }
                        isAllowed = false;
                    } else if (isShareScreenOpen && command.match(/(share video on linkedin|on linkedin|linkedin)/i)) {
                        var url = getShareVideoUrl(player);
                        var isAllowed = isSharingAllowed("linkedin");
                        if (isAllowed) {
                            window.open("https://www.linkedin.com/shareArticle?mini=true&url=" + url + "&summary=&source=Classic");
                        } else {
                            console.log("in else of linkedin");
                            var utteranceL = new SpeechSynthesisUtterance("Player is not configured to share video on linkedin.");
                            window.speechSynthesis.speak(utteranceL);
                        }
                        isAllowed = false;
                    } else if (command.match(/(close)/i)) {
                        isShareScreenOpen = false;
                        document.getElementsByClassName("vjs-close-button")[0].click();
                    }
                }

                var alternatives = [];
                for (var j = 1; j < result.length; ++j) {
                    alternatives.push(result[j].transcript);
                }
                alternativesDebug.innerHTML = alternatives.join('<br>');
            }
        };

        recognition.onerror = function (event) {
            status.innerHTML = 'Error.';
        };
        recognition.onend = function () {
            status.innerHTML = 'No Longer Listening.';
        };

        recognition.start();
    }
});

function getShareVideoUrl(player) {
    var index = player.playlist.currentItem();
    var playlistObj = player.playlist();
    console.log(playlistObj[index].id);

    var url = "https://studio.brightcove.com/products/videocloud/media/videos/" + playlistObj[index].id;
    return url;
}

function isSharingAllowed(socialMedia) {
    var div = document.getElementsByClassName("vjs-social-share-links")[0];
    var anchorTags = div.getElementsByTagName("a");
    var isAllowed = false;
    for (i = 0; i < anchorTags.length; i++) {
        if (anchorTags[i].getAttribute("href").indexOf(socialMedia) > -1) {
            isAllowed = true;
        }
    }

    return isAllowed;
}

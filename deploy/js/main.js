(function() {
  $((function(_this) {
    return function() {
      var a, _i, _j, _len, _ref, _results;
      _this.is_firefox = navigator.userAgent.toLowerCase().indexOf('firefox') > -1;
      _this.key = 'yoJC2IorC28DFEF1FS';
      _this.gifhyAPI_search = "http://api.giphy.com/v1/gifs/search?";
      _this.gifhyAPI_random = "http://api.giphy.com/v1/gifs/random?";
      _this.random_tags = ['christmas', 'christmas tree', 'santa', 'santa claus', 'xmas', 'winter', 'grandma', 'grandmas', 'food', 'cat', 'dog', 'animal', 'lol', 'funny', 'cute', 'fail', 'reactions'];
      _this.gifFPS = 10;
      _this.cameraFixPosFar = new THREE.Vector3(0, 150, 800);
      _this.cameraFixPosZoom = new THREE.Vector3(0, 150, 550);
      _this.cameraBasePos = _this.cameraFixPosFar.clone();
      _this.camPos = _this.cameraFixPosFar.clone();
      _this.isCameraFree = false;
      _this.loadingSprites = [THREE.ImageUtils.loadTexture("img/loading_sprites/l.png"), THREE.ImageUtils.loadTexture("img/loading_sprites/o.png"), THREE.ImageUtils.loadTexture("img/loading_sprites/a.png"), THREE.ImageUtils.loadTexture("img/loading_sprites/d.png"), THREE.ImageUtils.loadTexture("img/loading_sprites/i.png"), THREE.ImageUtils.loadTexture("img/loading_sprites/n.png"), THREE.ImageUtils.loadTexture("img/loading_sprites/g.png")];
      _this.ambientColdColor = 0x00174d;
      _this.ambientWarmColor = 0xa65c0d;
      _this.useMicrophone = false;
      _this.gifIsloaded = false;
      _this.isLightOn = false;
      _this.isInteractive = false;
      _this.isMouseOverGirl = false;
      _this.isMouseOverGif = false;
      _this.blowMeter = 0;
      _this.volume = 0;
      _this.volumeThreshold = 35;
      _this.blowThreshold = 10;
      _this.averageVolume = 0;
      _this.volumeSamples = (function() {
        _results = [];
        for (_i = 0; _i < 30; _i++){ _results.push(_i); }
        return _results;
      }).apply(this);
      _ref = _this.volumeSamples;
      for (_j = 0, _len = _ref.length; _j < _len; _j++) {
        a = _ref[_j];
        _this.volumeSamples[a] = 0;
      }
      _this.cangleLightIntensity = 1.5;
      if (_this.is_firefox) {
        _this.volumeThreshold *= 0.35;
      }
      _this.accessTrials = 0;
      _this.API_ACCESS_MAX_TRIALS = 5;
      _this.howlingSound = $('#howling').get(0);
      _this.lightMatchSound = $('#light').get(0);
      _this.blowMatchSound = $('#blow').get(0);
      _this.bgm = $('#bgm').get(0);
      _this.hohoho = $("#santavoice").get(0);
      _this.wow = $("#wow").get(0);
      _this.init = function() {
        return $("#start").on('click', (function(_this) {
          return function() {
            $("#start").html("Loading...");
            $("#start").addClass("loading");
            navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia;
            if (navigator.getUserMedia) {
              navigator.getUserMedia({
                audio: true
              }, _this.gotStream, _this.streamError);
            } else {
              init2();
            }
            return $("#start").off('click');
          };
        })(this));
      };
      _this.init2 = function() {
        _this.checkAudio();
        return _this.loadModels();
      };
      _this.init3 = function() {
        _this.initStage();
        _this.initWorker();
        _this.intro();
        return _this.animate();
      };
      _this.loadModels = function() {
        var loader, loader2, loader3, loader4;
        _this.modelsToload = 4;
        loader = new THREE.JSONLoader();
        loader.load('models/character_rigged2.json', function(geometry, materials) {
          var mat, o, _k, _l, _len1, _len2, _ref1;
          geometry.computeBoundingBox();
          _this.character = new THREE.SkinnedMesh(geometry, new THREE.MeshFaceMaterial(materials));
          for (_k = 0, _len1 = materials.length; _k < _len1; _k++) {
            mat = materials[_k];
            mat.skinning = true;
          }
          _this.character.scale.set(30, 30, 30);
          _this.character.position.z = 100;
          _this.animations = [];
          _ref1 = _this.character.geometry.animations;
          for (_l = 0, _len2 = _ref1.length; _l < _len2; _l++) {
            a = _ref1[_l];
            o = {
              name: a.name,
              animation: new THREE.Animation(_this.character, a)
            };
            _this.animations.push(o);
          }
          if (--_this.modelsToload === 0) {
            return init3();
          }
        });
        loader2 = new THREE.JSONLoader();
        loader2.load('models/match.json', function(geometry, materials) {
          var mat, _k, _len1;
          _this.match = new THREE.Mesh(geometry, new THREE.MeshFaceMaterial(materials));
          for (_k = 0, _len1 = materials.length; _k < _len1; _k++) {
            mat = materials[_k];
            if (mat.name === "Match_head") {
              _this.matchHeadMaterial = mat;
              _this.originalMatchHeadColor = mat.color.clone();
            }
          }
          if (--_this.modelsToload === 0) {
            return init3();
          }
        });
        loader3 = new THREE.JSONLoader();
        loader3.load('models/character_match_lighten.json', function(geometry, materials) {
          _this.character_match = new THREE.Mesh(geometry, new THREE.MeshFaceMaterial(materials));
          if (--_this.modelsToload === 0) {
            return init3();
          }
        });
        loader4 = new THREE.JSONLoader();
        return loader4.load('models/stage2.json', function(geometry, materials) {
          _this.stage = new THREE.Mesh(geometry, new THREE.MeshFaceMaterial(materials));
          if (--_this.modelsToload === 0) {
            return init3();
          }
        });
      };
      _this.checkAudio = function() {
        if (_this.howlingSound.paused) {
          return _this.howlingSound.play();
        }
      };
      _this.playAnimation = function(name, isLoop) {
        var _k, _len1, _ref1;
        if (isLoop == null) {
          isLoop = true;
        }
        if (_this.currentAnimation) {
          _this.currentAnimation.stop();
        }
        _ref1 = _this.animations;
        for (_k = 0, _len1 = _ref1.length; _k < _len1; _k++) {
          a = _ref1[_k];
          if (a.name === name) {
            _this.animationComplete = false;
            a.animation.loop = isLoop;
            a.animation.play();
            _this.currentAnimation = a.animation;
          }
        }
        return null;
      };
      _this.enableBlow = false;
      _this.gotStream = function(stream) {
        window.AudioContext = window.AudioContext || window.webkitAudioContext;
        _this.audioContext = new AudioContext();
        _this.mediaStreamSource = _this.audioContext.createMediaStreamSource(stream);
        _this.useMicrophone = true;
        _this.analyzer = _this.audioContext.createAnalyser();
        _this.analyzer.smoothingTimeConstant = 0.3;
        _this.analyzer.fftSize = 1024;
        _this.jsNode = _this.audioContext.createScriptProcessor(2048, 1, 1);
        _this.jsNode.onaudioprocess = function(e) {
          var array;
          if (_this.gifIsloaded) {
            array = new Uint8Array(_this.analyzer.frequencyBinCount);
            _this.analyzer.getByteFrequencyData(array);
            _this.volume = getAverageVolume(array);
            _this.volumeSamples.push(_this.volume);
            _this.volumeSamples.shift();
            _this.averageVolume = _this.getAverageVolume(_this.volumeSamples);
            if (_this.volume > _this.averageVolume + _this.volumeThreshold) {
              _this.blowMeter++;
              if (_this.blowMeter > _this.blowThreshold) {
                _this.blowMeter = _this.blowThreshold;
                if (_this.enableBlow) {
                  _this.removeGif();
                  return _this.blowMeter = 0;
                }
              }
            } else {
              if (--_this.blowMeter < 0) {
                return _this.blowMeter = 0;
              }
            }
          }
        };
        _this.mediaStreamSource.connect(_this.analyzer);
        _this.analyzer.connect(_this.jsNode);
        _this.jsNode.connect(audioContext.destination);
        return _this.init2();
      };
      _this.getAverageVolume = function(array) {
        var values, _k, _len1;
        values = 0;
        for (_k = 0, _len1 = array.length; _k < _len1; _k++) {
          a = array[_k];
          values += a;
        }
        return values / array.length;
      };
      _this.streamError = function(err) {
        console.log(err);
        _this.useMicrophone = false;
        return _this.init2();
      };
      _this.searchGif = function(query) {
        var api;
        api = "" + _this.gifhyAPI_search + "q=" + query + "&api_key=" + _this.key;
        return jQuery.ajax(api, {
          crossDomain: true
        }).done(function(response) {
          _this.accessTrials = 0;
          a = Math.floor(Math.random() * response.data.length);
          console.log(response.data[a]);
          _this.gifPageUrl = response.data[a].url;
          _this.videoSrc = response.data[a].images.original.mp4;
          _this.gifWidth = response.data[a].images.downsized.width;
          _this.gifHeight = response.data[a].images.downsized.height;
          _this.gifUrl = response.data[a].images.downsized.url;
          _this.gifFrames = response.data[a].images.original.frames;
          return _this.setupGif();
        }).error(function(err) {
          ++_this.accessTrials;
          if (_this.accessTrials < _this.API_ACCESS_MAX_TRIALS) {
            return _this.getRandomGif(query);
          }
        });
      };
      _this.currentTag = null;
      _this.hubURL = "http://prty.nyc/christmas/image.php";
      _this.getRandomGif = function(tag) {
        var api;
        _this.currentTag = tag;
        api = "" + _this.gifhyAPI_random + "tag=" + tag + "&api_key=" + _this.key;
        return jQuery.ajax(api, {
          crossDomain: true
        }).done(function(response) {
          console.log(response);
          _this.accessTrials = 0;
          _this.gifPageUrl = response.data.url;
          _this.videoSrc = response.data.image_mp4_url;
          _this.gifWidth = response.data.image_width;
          _this.gifHeight = response.data.image_height;
          _this.gifUrl = response.data.image_url;
          _this.gifFrames = response.data.image_frames;
          return _this.setupGif();
        }).error(function(err) {
          ++_this.accessTrials;
          if (_this.accessTrials < _this.API_ACCESS_MAX_TRIALS) {
            return _this.getRandomGif(tag);
          }
        });
      };
      _this.setupGif = function() {
        var h, w;
        _this.gifIsloaded = false;
        _this.gifMaterial.opacity = 0;
        if (_this.gifWidth > _this.gifHeight) {
          h = _this.gifHeight / 100 * 400 / _this.gifWidth;
          _this.gifPlane.scale.set(4, h, 1);
        } else {
          w = _this.gifWidth / 100 * 300 / _this.gifHeight;
          _this.gifPlane.scale.set(w, 3, 1);
        }
        return _this.loadImage(_this.hubURL + "?src=" + _this.gifUrl);
      };
      _this.idleId = 0;
      _this.goIdle = function() {
        if (_this.matchHolder.visible) {
          _this.matchHolder.visible = false;
        }
        if (!_this.isInteractive) {
          _this.isInteractive = true;
        }
        if (_this.cameraBasePos !== _this.cameraFixPosFar) {
          _this.cameraBasePos = _this.cameraFixPosFar;
        }
        clearTimeout(_this.idleId);
        return _this.idleId = setTimeout(function() {
          _this.onAnimationComplete = _this.goIdle;
          if (Math.random() < 0.5) {
            return _this.playAnimation('idle', false);
          } else {
            return _this.playAnimation('cold', false);
          }
        }, Math.random() * 1500);
      };
      _this.countGifLoaded = 0;
      _this.reloadGif = function() {
        var tags;
        _this.countGifLoaded++;
        _this.onAnimationComplete = null;
        if (_this.isIntroPlaying) {
          _this.searchGif('christmas+tree');
        } else {
          tags = _this.random_tags[Math.floor(_this.random_tags.length * Math.random())];
          _this.getRandomGif(tags);
        }
        if (_this.scene.children.indexOf(_this.ctaSprite) > -1) {
          TweenMax.to(_this.ctaSprite.material, 0.5, {
            opacity: 0,
            ease: Linear.easeNone
          });
        }
        _this.cameraBasePos = _this.cameraFixPosZoom;
        _this.matchHolder.visible = true;
        clearTimeout(_this.idleId);
        _this.matchHeadMaterial.color.copy(_this.originalMatchHeadColor);
        _this.playAnimation('takeoutmatch', false);
        setTimeout(function() {
          _this.lightMatchSound.play();
          _this.isLightOn = true;
          _this.fireMesh.visible = true;
          return _this.matchHeadMaterial.color.setRGB(0, 0, 0);
        }, 900);
        return setTimeout(function() {
          _this.loadingSparkCounter = 0;
          return _this.loadingSpark.visible = true;
        }, 2000);
      };
      _this.showGifAnimation = function() {
        var c, c2, cobj, minimumGifDuration;
        _this.loadingSpark.visible = false;
        _this.scene.add(_this.gifPlane);
        _this.character.visible = false;
        _this.character_match.visible = true;
        c = _this.ambientLight.color.clone();
        c2 = new THREE.Color(_this.ambientWarmColor);
        cobj = {
          r: c.r,
          g: c.g,
          b: c.b
        };
        _this.ambientTween = TweenMax.to(cobj, 4, {
          r: c2.r,
          g: c2.g,
          b: c2.b,
          ease: Linear.easeNone,
          onUpdate: function() {
            return _this.ambientLight.color.setRGB(cobj.r, cobj.g, cobj.b);
          }
        });
        TweenMax.to(_this.gifMaterial, 2, {
          opacity: 1,
          ease: Linear.easeNone
        });
        if (_this.countGifLoaded === 2) {
          checkMicCTA();
        }
        if (/santa/.test(_this.currentTag)) {
          _this.hohoho.currentTime = 0;
          _this.hohoho.play();
        } else {
          _this.bgm.play();
        }
        _this.howlingSound.pause();
        if (/grandma/.test(_this.currentTag)) {
          _this.wow.play();
          _this.scriptDiv.html("G R A N D M A !!!");
          $("#container").append(_this.scriptDiv);
        }
        setTimeout(function() {
          if (_this.useMicrophone) {
            return _this.enableBlow = true;
          }
        }, 2000);
        minimumGifDuration = (_this.gifFrames * (Math.random() * 3 + 3)) * _this.gifFPS + Math.random() * 7500 + 10000;
        clearTimeout(_this.removeId);
        return _this.removeId = setTimeout(_this.removeGif, minimumGifDuration);
      };
      _this.removeGif = function() {
        _this.gifIsloaded = false;
        clearTimeout(_this.removeId);
        _this.scene.remove(_this.gifPlane);
        _this.isLightOn = false;
        _this.fireMesh.visible = false;
        _this.candleLight.intensity = 0;
        _this.matchHeadMaterial.color.setRGB(0, 0, 0);
        _this.character.visible = true;
        _this.character_match.visible = false;
        _this.blowMatchSound.play();
        _this.ambientTween.kill();
        _this.ambientLight.color.set(_this.ambientColdColor);
        _this.bgm.pause();
        _this.hohoho.pause();
        _this.howlingSound.currentTime = 0;
        _this.howlingSound.play();
        _this.scriptDiv.remove();
        _this.enableBlow = false;
        if (_this.isIntroPlaying) {
          _this.onAnimationComplete = _this.intro2;
        } else {
          _this.onAnimationComplete = _this.goIdle;
        }
        _this.playAnimation('putbackmatch', false);
        return console.log('removed');
      };
      _this.checkMicCTA = function() {
        if (_this.useMicrophone) {
          _this.showedMicrophoneCta = true;
          _this.ctaSprite.material.map = _this.ctaTextures[2];
          TweenMax.to(_this.ctaSprite.material, 0.5, {
            opacity: 1,
            ease: Linear.easeNone,
            delay: 3,
            onComplete: function() {
              return TweenMax.to(_this.ctaSprite.material, 0.5, {
                opacity: 0.3,
                ease: Linear.easeNone,
                repeat: -1,
                yoyo: true
              });
            }
          });
          return setTimeout(function() {
            return TweenMax.to(_this.ctaSprite.material, 0.5, {
              opacity: 0,
              ease: Linear.easeNone,
              onComplete: function() {
                return _this.scene.remove(_this.ctaSprite);
              }
            });
          }, 10000);
        } else {
          if (_this.scene.children.indexOf(_this.ctaSprite) > -1) {
            return _this.scene.remove(_this.ctaSprite);
          }
        }
      };
      _this.tmpCanvas = document.createElement('canvas');
      _this.transparency = null;
      _this.delay = null;
      _this.disposalMethod = null;
      _this.lastDisposalMethod = null;
      _this.frame = null;
      _this.frameCount = 0;
      _this.textures = [];
      _this.initWorker = function() {
        _this.worker = new Worker('js/libs/Gif_worker.js');
        return _this.worker.addEventListener('message', function(e) {
          if (e.data.cmd === "hdr") {
            _this.doHdr(e.data.data);
          }
          if (e.data.cmd === "gce") {
            _this.doGCE(e.data.data);
          }
          if (e.data.cmd === "img") {
            _this.doImg(e.data.data);
          }
          if (e.data.cmd === "eof") {
            _this.gifIsloaded = true;
            _this.pushFrame();
            console.log('eof');
            _this.showGifAnimation();
            return;
          }
          if (e.data === "error") {
            return _this.removeGif();
          }
        }, false);
      };
      _this.loadImage = function(img) {
        var xhr;
        xhr = new XMLHttpRequest();
        xhr.open("GET", img, true);
        xhr.withCredentials = false;
        xhr.overrideMimeType('text/plain; charset=x-user-defined');
        _this.frameCount = 0;
        _this.textures = [];
        xhr.onload = function(e) {
          var arrayBuffer;
          arrayBuffer = xhr.responseText;
          _this.worker.postMessage({
            'cmd': 'parseGIF',
            'arrayBuffer': arrayBuffer
          });
        };
        xhr.send(null);
      };
      _this.clear = function() {
        this.transparency = null;
        this.delay = null;
        this.lastDisposalMethod = this.disposalMethod;
        this.disposalMethod = null;
        this.frame = null;
      };
      _this.doHdr = function(_hdr) {
        _this.hdr = _hdr;
        _this.tmpCanvas.width = _this.hdr.width;
        _this.tmpCanvas.height = _this.hdr.height;
      };
      _this.doGCE = function(gce) {
        _this.pushFrame();
        _this.clear();
        _this.transparency = (gce.transparencyGiven ? gce.transparencyIndex : null);
        _this.delay = gce.delayTime;
        _this.disposalMethod = gce.disposalMethod;
      };
      _this.pushFrame = function() {
        var tcanvas, tctx, texture;
        if (!frame) {
          return;
        }
        tcanvas = document.createElement('canvas');
        tcanvas.width = _this.tmpCanvas.width;
        tcanvas.height = _this.tmpCanvas.height;
        tctx = tcanvas.getContext('2d');
        tctx.drawImage(_this.tmpCanvas, 0, 0, _this.tmpCanvas.width, _this.tmpCanvas.height);
        texture = new THREE.Texture(tcanvas);
        texture.minFilter = THREE.LinearFilter;
        texture.magFilter = THREE.LinearFilter;
        texture.wrapS = THREE.ClampToEdgeWrapping;
        texture.wrapT = THREE.ClampToEdgeWrapping;
        texture.needsUpdate = true;
        _this.textures.push(texture);
        _this.frameCount++;
      };
      _this.doImg = function(img) {
        var cData, ct;
        if (!_this.frame) {
          _this.frame = _this.tmpCanvas.getContext('2d');
        }
        ct = img.lctFlag ? img.lct : _this.hdr.gct;
        cData = _this.frame.getImageData(img.leftPos, img.topPos, img.width, img.height);
        img.pixels.forEach(function(pixel, i) {
          if (_this.transparency !== pixel) {
            cData.data[i * 4 + 0] = ct[pixel][0];
            cData.data[i * 4 + 1] = ct[pixel][1];
            cData.data[i * 4 + 2] = ct[pixel][2];
            cData.data[i * 4 + 3] = 255;
          } else {
            if (_this.lastDisposalMethod === 2 || _this.lastDisposalMethod === 3) {
              cData.data[i * 4 + 3] = 0;
            }
          }
        });
        _this.frame.putImageData(cData, img.leftPos, img.topPos);
      };
      _this.doNothing = function() {};
      _this.intro = function() {
        var campos, firstAnim, getScript, scripts, tl;
        _this.isIntroPlaying = true;
        $("#container").css({
          opacity: 0
        });
        _this.camera.position.copy(_this.cameraFixPosFar);
        _this.cameraTarget.copy(_this.character.position);
        _this.cameraTarget.y += 100;
        _this.prologueDiv = $("<div id='prologue_div'></p>");
        _this.prologueDiv.css({
          'font-size': '2vw',
          'text-align': 'center',
          'line-height': 2,
          'z-index': '20',
          'letter-spacing': '2px',
          'text-shadow': '1px 1px 3px rgba(0, 0, 0, 1.00)',
          'position': 'absolute',
          'width': '50%',
          'height': '100px',
          'top': 0,
          'left': 0,
          'bottom': 0,
          'right': 0,
          'margin': 'auto',
          'overflow': 'visible',
          'opacity': 0
        });
        _this.prologueDiv.html($('#prologue>p'));
        $(document.body).append(_this.prologueDiv);
        _this.scriptDiv = $("<div id='script_div'></p>");
        _this.scriptDiv.css({
          'font-size': '2vw',
          'position': 'absolute',
          'width': '100%',
          'bottom': '25px',
          'text-align': 'center',
          'z-index': '20',
          'letter-spacing': '2px',
          'overflow': 'visible'
        });
        _this.scriptDiv.addClass("text_outline");
        $("#container").append(_this.scriptDiv);
        scripts = $("#intro_script>p");
        getScript = function(n) {
          return _this.scriptDiv.html(scripts[n]);
        };
        tl = new TimelineMax();
        _this.playAnimation('idle', true);
        tl.to($("#intro"), 2, {
          autoAlpha: 0,
          ease: Linear.easeNone
        });
        tl.fromTo(_this.prologueDiv, 2, {
          autoAlpha: 0
        }, {
          autoAlpha: 1,
          ease: Linear.easeNone
        });
        tl.to(_this.prologueDiv, 2, {
          autoAlpha: 0,
          ease: Linear.easeNone
        }, "+=4");
        tl.to($("#container"), 5, {
          alpha: 1,
          ease: Linear.easeNone
        });
        campos = _this.cameraTarget.clone();
        campos.sub(_this.camera.position);
        campos.normalize().multiplyScalar(400);
        campos.add(_this.camera.position);
        _this.camera.position.x += 100;
        _this.camera.position.y += 400;
        _this.camera.position.z -= 500;
        tl.to(_this.camera.position, 8, {
          x: campos.x,
          y: campos.y,
          z: campos.z,
          ease: Cubic.easeInOut
        }, "-=5");
        tl.addLabel("script");
        tl.addCallback(getScript, "script+=1", [0]);
        tl.addCallback(getScript, "script+=3", [1]);
        tl.addCallback(getScript, "script+=8", [2]);
        tl.addCallback(_this.playAnimation, "script+=8", ["cold", false]);
        tl.addCallback(getScript, "script+=12", [3]);
        tl.addCallback(getScript, "script+=16", [4]);
        tl.addLabel('movecam');
        tl.to(_this.camera.position, 3, {
          x: _this.cameraBasePos.x,
          y: _this.cameraBasePos.y,
          z: _this.cameraBasePos.z,
          ease: Cubic.easeInOut
        }, 'movecam+0.5');
        tl.to(_this.cameraTarget, 3, {
          x: 0,
          y: 150,
          z: 0,
          ease: Cubic.easeInOut
        }, 'movecam+=0.5');
        tl.to(_this.ctaSprite.material, 1, {
          opacity: 1,
          ease: Linear.easeNone
        });
        tl.addLabel('firsttry');
        firstAnim = function() {
          TweenMax.to(_this.ctaSprite.material, 0.5, {
            opacity: 0.3,
            ease: Linear.easeNone,
            repeat: -1,
            yoyo: true
          });
          _this.scriptDiv.remove();
          _this.isInteractive = true;
          _this.isCameraFree = true;
          return _this.goIdle();
        };
        tl.addCallback(firstAnim, "firsttry+=0.5");
        return tl.timeScale(20);
      };
      _this.intro2 = function() {
        var getScript, scripts, tl;
        console.log('intro2');
        _this.isInteractive = false;
        _this.isCameraFree = false;
        _this.onAnimationComplete = null;
        scripts = $("#intro_script2>p");
        getScript = function(n) {
          return _this.scriptDiv.html(scripts[n]);
        };
        _this.scriptDiv.html("");
        $("#container").append(_this.scriptDiv);
        tl = new TimelineMax();
        tl.addLabel("script");
        tl.addCallback(getScript, "script", [0]);
        tl.addCallback(getScript, "script+=4", [1]);
        tl.addCallback(getScript, "script+=8", [2]);
        tl.addCallback(function() {
          _this.scriptDiv.remove();
          _this.isIntroPlaying = false;
          _this.isInteractive = true;
          _this.isCameraFree = true;
          _this.ctaSprite.material.map = _this.ctaTextures[1];
          TweenMax.to(_this.ctaSprite.material, 1, {
            opacity: 1,
            ease: Linear.easeNone,
            onComplete: function() {
              return TweenMax.to(_this.ctaSprite.material, 0.5, {
                opacity: 0.3,
                ease: Linear.easeNone,
                repeat: -1,
                yoyo: true
              });
            }
          });
          return _this.goIdle();
        }, "script+=12");
        return tl.timeScale(20);
      };
      _this.loadingSparkCounter = 0;
      _this.initStage = function() {
        var attributes, ctaMaterial, e, fireMat, fireSprite, geom, lightTarget, mat, particlesNum, plnGeom, plnMat, plnMesh, positions, sizes, snowGeom, snowMaterial, txtr, uniforms, v, win_h, win_w, _k, _len1, _ref1;
        _this.clock = new THREE.Clock();
        win_w = window.innerWidth;
        win_h = window.innerHeight;
        _this.camera = new THREE.PerspectiveCamera(50, win_w / win_h, 1, 10000);
        _this.cameraTarget = new THREE.Vector3(0, 0, 0);
        _this.scene = new THREE.Scene();
        _this.renderer = new THREE.WebGLRenderer({
          antialias: true
        });
        _this.renderer.setSize(win_w, win_h);
        _this.renderer.sortObject = true;
        _this.renderer.shadowMapEnabled = true;
        $('#container')[0].appendChild(_this.renderer.domElement);
        _this.scene.add(_this.character);
        _this.character.rotation.y = 30 * Math.PI / 180;
        _this.character.position.x = -180;
        _this.character.castShadow = true;
        _this.character.receiveShadow = false;
        _this.character_match.position.copy(_this.character.position);
        _this.character_match.rotation.copy(_this.character.rotation);
        _this.character_match.scale.copy(_this.character.scale);
        _this.character_match.visible = false;
        _this.character_match.castShadow = true;
        _this.character_match.receiveShadow = false;
        _this.scene.add(_this.character_match);
        _this.matchHolder = new THREE.Object3D();
        _this.match.position.set(5, 0, -25);
        _this.match.rotation.set(-Math.PI / 2, 0, -30 * Math.PI / 180);
        _this.match.scale.set(30, 30, 30);
        _this.matchHolder.add(_this.match);
        _this.scene.add(_this.matchHolder);
        _this.match.castShadow = true;
        fireSprite = THREE.ImageUtils.loadTexture("img/match_fire.jpg");
        fireMat = new THREE.SpriteMaterial({
          map: fireSprite,
          blending: THREE.AdditiveBlending,
          useScreenCoordinates: false,
          transparent: true
        });
        _this.fireMesh = new THREE.Sprite(fireMat);
        _this.fireMesh.scale.set(60, 60, 1);
        _this.fireMesh.visible = false;
        e = _this.match.rotation.clone();
        v = new THREE.Vector3(0, 1, 0);
        v.applyEuler(e);
        v.multiplyScalar(30);
        v.add(_this.match.position);
        _this.candleLight = new THREE.PointLight(0xff9a30, 0, 700);
        _this.candleLight.position.copy(v);
        _this.candleLight.add(_this.fireMesh);
        _this.matchHolder.add(_this.candleLight);
        _this.loadingSpark = new THREE.Object3D();
        _this.loadingPlanes = [];
        plnGeom = new THREE.PlaneBufferGeometry(14, 14, 0, 0);
        _ref1 = _this.loadingSprites;
        for (_k = 0, _len1 = _ref1.length; _k < _len1; _k++) {
          txtr = _ref1[_k];
          plnMat = new THREE.MeshBasicMaterial({
            map: txtr,
            blending: THREE.AdditiveBlending,
            side: THREE.DoubleSide,
            transparent: true,
            depthTest: false
          });
          plnMesh = new THREE.Mesh(plnGeom, plnMat);
          _this.loadingPlanes.push(plnMesh);
          _this.loadingSpark.add(plnMesh);
        }
        _this.loadingSpark.position.copy(v);
        _this.loadingSpark.visible = false;
        _this.matchHolder.add(_this.loadingSpark);
        _this.ctaTextures = [THREE.ImageUtils.loadTexture("img/cta1.png"), THREE.ImageUtils.loadTexture("img/cta2.png"), THREE.ImageUtils.loadTexture("img/cta3.png")];
        ctaMaterial = new THREE.SpriteMaterial({
          map: _this.ctaTextures[0],
          useScreenCoordinates: false,
          transparent: true,
          opacity: 0
        });
        _this.ctaSprite = new THREE.Sprite(ctaMaterial);
        _this.ctaSprite.scale.set(520 * 0.5, 120 * 0.5, 1);
        _this.ctaSprite.position.copy(_this.character.position);
        _this.ctaSprite.position.y += 260;
        _this.scene.add(_this.ctaSprite);
        _this.gifTextrue = new THREE.Texture();
        _this.gifMaterial = new THREE.MeshLambertMaterial({
          map: _this.gifTextrue,
          color: 0x666666,
          transparent: true,
          blending: THREE.AdditiveBlending,
          depthTest: true
        });
        geom = new THREE.PlaneBufferGeometry(100, 100, 10, 10);
        _this.gifPlane = new THREE.Mesh(geom, _this.gifMaterial);
        _this.gifPlane.position.x = 60;
        _this.gifPlane.position.y = 250;
        _this.gifPlane.position.z = -125;
        _this.scene.add(_this.gifPlane);
        _this.stage.scale.set(30, 30, 30);
        _this.stage.receiveShadow = true;
        _this.scene.add(_this.stage);
        geom = new THREE.BoxGeometry(90, 135, 3);
        mat = new THREE.MeshBasicMaterial({
          color: 0xff0000,
          opacity: 0.0,
          transparent: true,
          depthTest: false
        });
        _this.poster1 = new THREE.Mesh(geom, mat);
        _this.poster1.position.set(340, 158, -145);
        _this.scene.add(_this.poster1);
        _this.poster2 = new THREE.Mesh(geom, mat);
        _this.poster2.position.set(455, 150, -145);
        _this.poster2.rotation.z = 0.2;
        _this.scene.add(_this.poster2);
        particlesNum = 400;
        attributes = {
          size: {
            type: 'f',
            value: null
          }
        };
        uniforms = {
          time: {
            type: 'f',
            value: 0
          },
          color: {
            type: "c",
            value: new THREE.Color(0xffffff)
          },
          texture: {
            type: 't',
            value: THREE.ImageUtils.loadTexture('img/snowflake.png')
          }
        };
        snowMaterial = new THREE.ShaderMaterial({
          uniforms: uniforms,
          attributes: attributes,
          vertexShader: document.getElementById('vertexshader').textContent,
          fragmentShader: document.getElementById('fragmentshader').textContent,
          blending: THREE.AdditiveBlending,
          depthTest: false,
          transparent: true
        });
        snowGeom = new THREE.BufferGeometry();
        positions = new Float32Array(particlesNum * 3);
        sizes = new Float32Array(particlesNum);
        v = 0;
        while (v < particlesNum) {
          sizes[v] = 40 + Math.random() * 40;
          positions[v * 3 + 0] = (Math.random() * 2 - 1) * 800;
          positions[v * 3 + 1] = (Math.random() * 2 - 1) * 800;
          positions[v * 3 + 2] = -Math.random() * 800;
          v++;
        }
        snowGeom.addAttribute('position', new THREE.BufferAttribute(positions, 3));
        snowGeom.addAttribute('size', new THREE.BufferAttribute(sizes, 1));
        _this.snow = new THREE.PointCloud(snowGeom, snowMaterial);
        _this.snow.position.z = _this.cameraFixPosFar.z;
        _this.scene.add(_this.snow);
        _this.spotLight = new THREE.SpotLight(0xffd9ac, 1.5);
        _this.spotLight.position.set(200, 500, 500);
        lightTarget = new THREE.Object3D();
        lightTarget.position.set(60, 300, 0);
        _this.scene.add(lightTarget);
        _this.spotLight.target = lightTarget;
        _this.spotLight.castShadow = true;
        _this.spotLight.shadowMapWidth = 1024;
        _this.spotLight.shadowMapHeight = 1024;
        _this.spotLight.shadowCameraNear = 200;
        _this.spotLight.shadowCameraFar = 1500;
        _this.spotLight.shadowBias = 0.0001;
        _this.spotLight.shadowDarkness = 0.3;
        _this.scene.add(_this.spotLight);
        _this.pointLight = new THREE.PointLight(0x94b4ff, 1.4);
        _this.pointLight.position.set(0, 500, 350);
        _this.scene.add(_this.pointLight);
        _this.ambientLight = new THREE.AmbientLight(_this.ambientColdColor);
        _this.scene.add(_this.ambientLight);
        _this.raycaster = new THREE.Raycaster();
        _this.mouse = {
          x: 0,
          y: 0
        };
        $(document).on('mousemove', _this.onMouseMove);
        $(document.body).on('touchmove', _this.onMouseMove);
        $(document.body).on('mousedown', _this.onClick);
        $(document.body).on('touchstart', _this.onTouch);
        $(window).on('resize', _this.layout);
        return _this.layout();
      };
      _this.onMouseMove = function(e) {
        var touches;
        touches = e.originalEvent.touches || e.touches;
        if (touches) {
          _this.mouse.x = (touches[0].clientX / window.innerWidth) * 2 - 1;
          return _this.mouse.y = -(touches[0].clientY / window.innerHeight) * 2 + 1;
        } else {
          _this.mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
          _this.mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
          return _this.detectObject(_this.mouse.x, _this.mouse.y);
        }
      };
      _this.mouseOverObject = null;
      _this.detectObject = function(x, y) {
        var includeCharacter, includeGifPlane, includePoster1, includePoster2, intersects, vector, _k, _len1;
        vector = new THREE.Vector3(x, y, 1).unproject(_this.camera);
        _this.raycaster.set(_this.camera.position, vector.sub(_this.camera.position).normalize());
        intersects = raycaster.intersectObjects(_this.scene.children);
        if (intersects.length > 0) {
          includeCharacter = false;
          includeGifPlane = false;
          includePoster1 = false;
          includePoster2 = false;
          for (_k = 0, _len1 = intersects.length; _k < _len1; _k++) {
            a = intersects[_k];
            if (a.object === _this.character) {
              includeCharacter = true;
            }
            if (a.object === _this.gifPlane) {
              includeGifPlane = true;
            }
            if (a.object === _this.poster1) {
              includePoster1 = true;
            }
            if (a.object === _this.poster2) {
              includePoster2 = true;
            }
          }
          if (includeCharacter || includeGifPlane || includePoster1 || includePoster2) {
            if (includeCharacter && !_this.isMouseOverGirl && _this.isInteractive) {
              document.body.style.cursor = 'pointer';
              _this.mouseOverObject = _this.character;
            }
            if (includeGifPlane && !_this.isMouseOverGif && _this.gifIsloaded) {
              document.body.style.cursor = 'pointer';
              _this.mouseOverObject = _this.gifPlane;
            }
            if (includePoster1) {
              document.body.style.cursor = 'pointer';
              _this.mouseOverObject = _this.poster1;
            }
            if (includePoster2) {
              document.body.style.cursor = 'pointer';
              return _this.mouseOverObject = _this.poster2;
            }
          } else {
            _this.mouseOverObject = null;
            return document.body.style.cursor = 'auto';
          }
        }
      };
      _this.onTouch = function(e) {
        var touches;
        touches = e.originalEvent.touches || e.touches;
        console.log(e);
        _this.mouse.x = (touches[0].clientX / window.innerWidth) * 2 - 1;
        _this.mouse.y = -(touches[0].clientY / window.innerHeight) * 2 + 1;
        _this.detectObject(_this.mouse.x, _this.mouse.y);
        if (!_this.isClicked) {
          return _this.onClick();
        }
      };
      _this.onClick = function(e) {
        e.preventDefault();
        if (_this.mouseOverObject === _this.character && _this.isInteractive) {
          _this.isInteractive = false;
          document.body.style.cursor = 'auto';
          return reloadGif();
        } else if (_this.mouseOverObject === _this.gifPlane) {
          return window.open(_this.gifPageUrl, "_blank");
        } else if (_this.mouseOverObject === _this.poster1) {
          return window.open("http://giphy.com/", "_blank");
        } else if (_this.mouseOverObject === _this.poster2) {
          return window.open("https://twitter.com/muroicci", "_blank");
        }
      };
      _this.layout = function() {
        var h, win_h, win_w;
        win_w = window.innerWidth;
        win_h = window.innerHeight;
        h = win_w * 9 / 16;
        if (h > win_h) {
          h = win_h;
        }
        _this.camera.aspect = win_w / h;
        _this.camera.updateProjectionMatrix();
        _this.renderer.setSize(win_w, h);
        return $("#container").css({
          'position': 'absolute',
          'top': '50%',
          'margin-top': -h / 2
        });
      };
      _this.animate = function() {
        requestAnimationFrame(_this.animate);
        if (_this.currentAnimation && !_this.currentAnimation.isPlaying && !_this.animationComplete) {
          _this.animationComplete = true;
          if (_this.onAnimationComplete) {
            _this.onAnimationComplete();
          }
        }
        return _this.render();
      };
      _this.counter = 0;
      _this.now = Date.now();
      _this.then = Date.now();
      _this.interval = 1000 / _this.gifFPS;
      _this.delta = 0;
      _this.noise = new SimplexNoise();
      _this.render = function() {
        var bone, delta, elapsedTime, far, i, l, overwrap, pln, plnv2, pos, q, r, snowPositions, txtr, v, _k, _len1, _ref1;
        elapsedTime = _this.clock.elapsedTime;
        delta = _this.clock.getDelta();
        if (_this.isCameraFree) {
          _this.camPos.x = _this.cameraBasePos.x + _this.mouse.x * 150;
          _this.camPos.y = _this.cameraBasePos.y + _this.mouse.y * 100;
          _this.camPos.z = _this.cameraBasePos.z;
          _this.camera.position.add(_this.camPos.clone().sub(_this.camera.position).multiplyScalar(0.025));
        }
        _this.camera.lookAt(_this.cameraTarget);
        THREE.AnimationHandler.update(delta);
        bone = _this.scene.getObjectByName("L_hand");
        pos = new THREE.Vector3();
        pos.setFromMatrixPosition(bone.matrixWorld);
        q = bone.getWorldQuaternion();
        _this.matchHolder.position.set(pos.x, pos.y, pos.z);
        _this.matchHolder.quaternion.copy(q);
        _this.now = Date.now();
        _this.delta = _this.now - _this.then;
        if (_this.delta > _this.interval && _this.gifIsloaded) {
          _this.then = _this.now - (_this.delta % _this.interval);
          _this.counter++;
          if (_this.counter >= _this.gifFrames) {
            _this.counter = 1;
          }
          if (_this.isLightOn && _this.gifIsloaded) {
            txtr = _this.textures[_this.counter];
            _this.gifPlane.material.map = txtr;
          }
        }
        if (_this.isLightOn) {
          v = _this.cangleLightIntensity + 0.4 * Math.sin(_this.clock.getElapsedTime() * 60);
          _this.candleLight.intensity = v;
          _this.fireMesh.material.opacity = v;
          _this.fireMesh.scale.y = v * 50 - _this.blowMeter * Math.random() * 10;
          _this.fireMesh.material.rotation = (Math.random() * 2 - 1) * _this.blowMeter * 5 * 0.01745329251;
          if (!_this.gifIsloaded) {
            _this.loadingSpark.lookAt(_this.matchHolder.position);
            far = -180;
            overwrap = 10;
            l = _this.loadingPlanes.length;
            _this.loadingSparkCounter += 0.008;
            if (_this.loadingSparkCounter > 1 + overwrap / l) {
              _this.loadingSparkCounter = 0;
            }
            _ref1 = _this.loadingPlanes;
            for (i = _k = 0, _len1 = _ref1.length; _k < _len1; i = ++_k) {
              pln = _ref1[i];
              pln.rotation.x = Math.PI / 2;
              pln.rotation.z = Math.PI;
              if (_this.loadingSparkCounter <= i / l) {
                pln.position.set(0, 0, -Math.random() * 30);
                pln.rotation.y = Math.PI / 2;
                pln.material.opacity = 0;
              } else {
                v = _this.map_range(_this.loadingSparkCounter, i / l, i / l + overwrap / l, 0, 1);
                plnv2 = pln.position.clone();
                plnv2.multiplyScalar(0.005 + i * 0.00050);
                r = _this.noise.noise(plnv2.x, plnv2.z);
                pln.position.x = v * 50 * Math.sin(_this.loadingSparkCounter * Math.PI * 2) + v * v * r * 40;
                pln.position.y = v * 50 * Math.cos(_this.loadingSparkCounter * Math.PI * 2) + v * v * r * 40;
                pln.position.z = v * v * far + r * 25 - 30;
                pln.rotation.y = Math.sin(v * 10) * 1.0;
                pln.rotation.x = Math.sin(v * i) * 0.3 + Math.PI / 2;
                pln.rotation.z = Math.cos(v * i) * 0.2 + Math.PI;
                pln.material.opacity = (1 - v) * (Math.random() * 0.5 + 0.5);
              }
            }
          }
        }
        snowPositions = _this.snow.geometry.attributes.position.array;
        i = 0;
        l = snowPositions.length;
        while (i < l) {
          snowPositions[i] += Math.sin((elapsedTime + (i % 3)) * 0.5) * 1.5;
          i++;
          if (snowPositions[i] < -10) {
            snowPositions[i] = 800 + Math.random() * 800;
          } else {
            snowPositions[i] -= 1 + (i % 3);
          }
          i++;
          snowPositions[i] += Math.cos((elapsedTime + (i % 4)) * 0.4) * 1.0;
          i++;
        }
        _this.snow.material.uniforms.time.value = elapsedTime;
        _this.snow.geometry.attributes.position.needsUpdate = true;
        return _this.renderer.render(_this.scene, _this.camera);
      };
      _this.map_range = function(value, low1, high1, low2, high2) {
        return low2 + (high2 - low2) * (value - low1) / (high1 - low1);
      };
      init();
    };
  })(this));

}).call(this);

//# sourceMappingURL=main.js.map

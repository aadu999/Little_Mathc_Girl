
$ =>

	@is_firefox = navigator.userAgent.toLowerCase().indexOf('firefox') > -1

	@key = 'yoJC2IorC28DFEF1FS'
	@gifhyAPI_search = "http://api.giphy.com/v1/gifs/search?"
	@gifhyAPI_random = "http://api.giphy.com/v1/gifs/random?"

	@random_tags = ['christmas', 'christmas tree','santa', 'santa claus', 'xmas', 'winter', 'grandma', 'grandmas', 'food', 'cat', 'dog', 'animal', 'lol', 'funny', 'cute', 'fail', 'reactions']
	@gifFPS = 10

	@cameraFixPosFar = new THREE.Vector3(0,150,800)
	@cameraFixPosZoom = new THREE.Vector3(0,150,550)
	@cameraBasePos = @cameraFixPosFar.clone()
	@camPos = @cameraFixPosFar.clone()
	@isCameraFree = false

	@loadingSprites = [
		THREE.ImageUtils.loadTexture("img/loading_sprites/l.png")
		THREE.ImageUtils.loadTexture("img/loading_sprites/o.png")
		THREE.ImageUtils.loadTexture("img/loading_sprites/a.png")
		THREE.ImageUtils.loadTexture("img/loading_sprites/d.png")
		THREE.ImageUtils.loadTexture("img/loading_sprites/i.png")
		THREE.ImageUtils.loadTexture("img/loading_sprites/n.png")
		THREE.ImageUtils.loadTexture("img/loading_sprites/g.png")
	]

	@ambientColdColor = 0x00174d
	@ambientWarmColor = 0xa65c0d


	@useMicrophone = false
	@gifIsloaded = false
	@isLightOn = false
	@isInteractive = false 
	@isMouseOverGirl = false
	@isMouseOverGif = false

	@blowMeter = 0
	@volume = 0
	@volumeThreshold = 35
	@blowThreshold = 10
	@averageVolume = 0
	@volumeSamples = [0...30]
	for a in @volumeSamples
		@volumeSamples[a] = 0

	@cangleLightIntensity = 1.5

	# for firefox
	if @is_firefox then @volumeThreshold *= 0.35


	@accessTrials = 0
	@API_ACCESS_MAX_TRIALS = 5


	# audios
	@howlingSound = $('#howling').get(0)
	@lightMatchSound = $('#light').get(0)
	@blowMatchSound = $('#blow').get(0)
	@bgm = $('#bgm').get(0)
	@hohoho = $("#santavoice").get(0)
	@wow = $("#wow").get(0)


	@init = ->

		$("#start").on('click', =>

			$("#start").html("Loading...")
			$("#start").addClass("loading")


			navigator.getUserMedia = navigator.getUserMedia or navigator.webkitGetUserMedia or navigator.mozGetUserMedia
			if navigator.getUserMedia
				navigator.getUserMedia( {audio:true}, @gotStream, @streamError )
			else
				init2()

			$("#start").off('click')
		)

		# debug
		# @stats = new Stats()
		# document.body.appendChild(@stats.domElement)

		# gui = new dat.GUI()
		# gui.add( @, 'volume', 0,255).listen()
		# gui.add( @, 'volumeThreshold', 0,255)
		# gui.add( @, 'blowThreshold', 0, 20)
		# gui.add( @, 'blowMeter', 0, @blowThreshold*2).listen()
		# gui.add( @, 'averageVolume').listen()





	@init2 = =>
		@checkAudio()
		@loadModels()



	@init3 = =>

		@initStage()

		# GIF.js worker
		@initWorker()

		# start intro
		@intro()

		@animate()


	@loadModels = =>

		@modelsToload = 4

		loader = new THREE.JSONLoader()
		loader.load( 'models/character_rigged2.json', (geometry, materials)=>

			geometry.computeBoundingBox()

			@character = new THREE.SkinnedMesh( geometry, new THREE.MeshFaceMaterial(materials))
			for mat in materials
				mat.skinning = true

			@character.scale.set(30,30,30)
			@character.position.z = 100


			@animations = []
			for a in @character.geometry.animations
				o = {
					name: a.name
					animation: new THREE.Animation(@character, a)
				}
				@animations.push(o)

			if --@modelsToload==0 then init3()

		)

		# Match
		loader2 = new THREE.JSONLoader()
		loader2.load('models/match.json', (geometry, materials)=>


			@match = new THREE.Mesh( geometry, new THREE.MeshFaceMaterial(materials) )

			for mat in materials
				if mat.name is "Match_head" 
					@matchHeadMaterial = mat
					@originalMatchHeadColor = mat.color.clone()

			if --@modelsToload==0 then init3()
		)


		# smile body
		loader3 = new THREE.JSONLoader()
		loader3.load('models/character_match_lighten.json', (geometry, materials)=>

			@character_match = new THREE.Mesh(geometry, new THREE.MeshFaceMaterial(materials))

			if --@modelsToload==0 then init3()

		)

		# Stage
		loader4 = new THREE.JSONLoader()
		loader4.load('models/stage2.json', (geometry, materials)=>
			@stage = new THREE.Mesh(geometry, new THREE.MeshFaceMaterial(materials))
			# bump mapping todo

			if --@modelsToload==0 then init3()

		)



	@checkAudio = =>
		if @howlingSound.paused
			@howlingSound.play()




	@playAnimation = (name, isLoop=true)=>

		if @currentAnimation then @currentAnimation.stop()

		for a in @animations
			if a.name is name
				@animationComplete = false
				a.animation.loop = isLoop 
				a.animation.play()
				@currentAnimation = a.animation

		return null





	@enableBlow = false
	@gotStream = (stream)=>

		window.AudioContext = window.AudioContext or window.webkitAudioContext
		@audioContext = new AudioContext()
		@mediaStreamSource = @audioContext.createMediaStreamSource(stream)
		@useMicrophone = true

		# init audio
		@analyzer = @audioContext.createAnalyser()
		@analyzer.smoothingTimeConstant = 0.3
		@analyzer.fftSize = 1024

		@jsNode = @audioContext.createScriptProcessor(2048,1,1)

		@jsNode.onaudioprocess = (e)=>

			if @gifIsloaded
				array = new Uint8Array(@analyzer.frequencyBinCount)
				@analyzer.getByteFrequencyData(array)
				@volume = getAverageVolume(array)
				@volumeSamples.push(@volume)
				@volumeSamples.shift()
				@averageVolume = @getAverageVolume(@volumeSamples)

				if(@volume > @averageVolume + @volumeThreshold)

					@blowMeter++
					
					if @blowMeter>@blowThreshold
						@blowMeter = @blowThreshold
						if @enableBlow
							@removeGif()
							@blowMeter = 0


				else
					if --@blowMeter < 0 then @blowMeter=0





		@mediaStreamSource.connect(@analyzer)
		@analyzer.connect(@jsNode)
		@jsNode.connect(audioContext.destination)

		@init2()



	@getAverageVolume = (array)=>
	    values = 0
	    for a in array
	    	values += a
	    return values / (array.length)
	


	@streamError = (err)=>
		console.log err
		@useMicrophone = false
		@init2()







	@searchGif = (query)=>
		api = "#{@gifhyAPI_search}q=#{query}&api_key=#{@key}"

		jQuery.ajax( api, {
			crossDomain: true
		} ).done( (response)=> 
			@accessTrials = 0
			a = Math.floor(Math.random()*response.data.length)
			console.log response.data[a]

			@gifPageUrl = response.data[a].url
			@videoSrc = response.data[a].images.original.mp4
			@gifWidth = response.data[a].images.downsized.width
			@gifHeight = response.data[a].images.downsized.height
			@gifUrl = response.data[a].images.downsized.url
			@gifFrames = response.data[a].images.original.frames

			@setupGif()
		).error( (err)=>
			# try again
			++@accessTrials
			if(@accessTrials<@API_ACCESS_MAX_TRIALS) then @getRandomGif(query)
		)




	@currentTag = null 
	@hubURL = "http://prty.nyc/christmas/image.php"

	@getRandomGif = (tag)=>
		@currentTag = tag 
		api = "#{@gifhyAPI_random}tag=#{tag}&api_key=#{@key}"

		jQuery.ajax( api, {
			crossDomain: true
		}).done( (response)=>
			console.log response
			@accessTrials = 0

			@gifPageUrl = response.data.url
			@videoSrc = response.data.image_mp4_url
			@gifWidth = response.data.image_width
			@gifHeight = response.data.image_height
			@gifUrl = response.data.image_url
			@gifFrames = response.data.image_frames

			@setupGif()			
		).error( (err)=>
			# try again
			++@accessTrials
			if(@accessTrials<@API_ACCESS_MAX_TRIALS) then @getRandomGif(tag)
		)







	@setupGif = =>

		@gifIsloaded = false
		@gifMaterial.opacity = 0

		if @gifWidth > @gifHeight
			h = @gifHeight/100 * 400/@gifWidth
			@gifPlane.scale.set( 4, h, 1 )
		else
			w = @gifWidth/100 * 300/@gifHeight
			@gifPlane.scale.set( w, 3, 1 )


		# Parse GIF
		@loadImage(@hubURL + "?src=" + @gifUrl)
		# @loadImage(@gifUrl)



	@idleId = 0 

	@goIdle = =>

		if @matchHolder.visible then @matchHolder.visible = false
		if not @isInteractive then @isInteractive = true 
		
		if @cameraBasePos isnt @cameraFixPosFar then @cameraBasePos = @cameraFixPosFar




		clearTimeout(@idleId)
		@idleId = setTimeout( =>
			@onAnimationComplete = @goIdle
			if Math.random()<0.5
				@playAnimation('idle', false)
			else
				@playAnimation('cold', false)
		, Math.random()*1500)



	@countGifLoaded = 0

	@reloadGif = =>

		@countGifLoaded++
		@onAnimationComplete = null

		if @isIntroPlaying
			@searchGif('christmas+tree')
		else
			tags = @random_tags[ Math.floor(@random_tags.length * Math.random()) ]
			@getRandomGif(tags)

		# hide cta if it exists
		if @scene.children.indexOf(@ctaSprite) > -1
			TweenMax.to(@ctaSprite.material, 0.5, {opacity:0, ease:Linear.easeNone})


		@cameraBasePos = @cameraFixPosZoom
		@matchHolder.visible = true
		clearTimeout(@idleId)
		@matchHeadMaterial.color.copy(@originalMatchHeadColor)
		@playAnimation('takeoutmatch', false)

		setTimeout(=>
			@lightMatchSound.play()
			@isLightOn = true 
			@fireMesh.visible = true 
			@matchHeadMaterial.color.setRGB(0,0,0)

		, 900)

		setTimeout =>
			@loadingSparkCounter = 0
			@loadingSpark.visible = true 
		, 2000




	@showGifAnimation = =>

		@loadingSpark.visible = false

		@scene.add(@gifPlane)

		@character.visible = false
		@character_match.visible = true

		# ambient light
		c = @ambientLight.color.clone()
		c2 = new THREE.Color(@ambientWarmColor)
		cobj = {r:c.r, g:c.g, b:c.b}
		@ambientTween = TweenMax.to(cobj, 4, {
			r:c2.r
			g:c2.g
			b:c2.b
			ease: Linear.easeNone
			onUpdate: =>
				@ambientLight.color.setRGB(cobj.r, cobj.g, cobj.b)
		})

		TweenMax.to( @gifMaterial, 2, {opacity:1, ease:Linear.easeNone} )

		# check microphone cta
		if @countGifLoaded is 2
			checkMicCTA()

		# santa
		if /santa/.test(@currentTag)
			@hohoho.currentTime = 0
			@hohoho.play()
		else 
			@bgm.play()
		@howlingSound.pause()

		# grandma
		if /grandma/.test(@currentTag)
			@wow.play()
			@scriptDiv.html("G R A N D M A !!!")
			$("#container").append(@scriptDiv)

		# enable blowing 
		setTimeout =>
			if @useMicrophone then @enableBlow = true
		, 2000

		# set time out for removing gif
		minimumGifDuration = ( @gifFrames*(Math.random()*3+3) )*@gifFPS + Math.random()*7500 + 10000
		clearTimeout(@removeId)
		@removeId = setTimeout( @removeGif, minimumGifDuration )





	@removeGif = =>

		@gifIsloaded = false 

		clearTimeout(@removeId)
		@scene.remove(@gifPlane)

		@isLightOn = false
		@fireMesh.visible = false
		@candleLight.intensity = 0 
		@matchHeadMaterial.color.setRGB(0,0,0)
		@character.visible = true
		@character_match.visible = false
		@blowMatchSound.play()
		@ambientTween.kill()
		@ambientLight.color.set( @ambientColdColor )

		@bgm.pause()
		@hohoho.pause()
		@howlingSound.currentTime = 0
		@howlingSound.play()

		@scriptDiv.remove()
		@enableBlow = false


		if @isIntroPlaying
			@onAnimationComplete = @intro2
		else
			@onAnimationComplete = @goIdle

		@playAnimation('putbackmatch', false)

		console.log 'removed'



	@checkMicCTA = =>

		if @useMicrophone
			@showedMicrophoneCta = true
			@ctaSprite.material.map = @ctaTextures[2]
			TweenMax.to(@ctaSprite.material, 0.5, {opacity:1, ease:Linear.easeNone, delay:3, onComplete:=>
				TweenMax.to(@ctaSprite.material, 0.5, { opacity:0.3, ease:Linear.easeNone, repeat:-1, yoyo:true })
			})

			setTimeout =>
				TweenMax.to(@ctaSprite.material, 0.5, {opacity:0, ease:Linear.easeNone, onComplete:=>
					@scene.remove(@ctaSprite)
				})
			,10000
				
		else
			if @scene.children.indexOf(@ctaSprite)>-1 then @scene.remove(@ctaSprite)








	# Anlyze Gif animation
	@tmpCanvas = document.createElement('canvas')
	@transparency = null
	@delay = null 
	@disposalMethod = null
	@lastDisposalMethod = null
	@frame = null
	@frameCount = 0
	@textures = []



	@initWorker = =>

		@worker = new Worker('js/libs/Gif_worker.js')

		@worker.addEventListener('message', (e)=>
			if e.data.cmd is "hdr"
				@doHdr(e.data.data)

			if e.data.cmd is "gce"
				@doGCE(e.data.data)

			if e.data.cmd is "img"
				@doImg(e.data.data)

			if e.data.cmd is "eof"
				@gifIsloaded = true
				@pushFrame()
				console.log ('eof')

				@showGifAnimation()
				return 
			if e.data is "error"
				@removeGif()


		, false)




	
	@loadImage = (img)=>


		xhr = new XMLHttpRequest()
		xhr.open("GET", img, true)
		# xhr.responseType = 'arraybuffer'
		xhr.withCredentials = false
		xhr.overrideMimeType('text/plain; charset=x-user-defined')

		@frameCount = 0
		@textures = []

		xhr.onload = (e)=>
			arrayBuffer = xhr.responseText
			@worker.postMessage({'cmd':'parseGIF', 'arrayBuffer':arrayBuffer})
			# @parseGIF( new Stream(arrayBuffer), @handler() )
			return 

		xhr.send(null)
		return 



	@clear = ->
		@transparency = null
		@delay = null 
		@lastDisposalMethod = @disposalMethod
		@disposalMethod = null
		@frame = null
		return 



	@doHdr = (_hdr)=>
		@hdr = _hdr
		@tmpCanvas.width = @hdr.width
		@tmpCanvas.height = @hdr.height
		return 



	@doGCE = (gce)=>

		@pushFrame()		
		@clear()
		@transparency = (if gce.transparencyGiven then gce.transparencyIndex else null)
		@delay = gce.delayTime
		@disposalMethod = gce.disposalMethod
		return



	@pushFrame = =>

		return unless frame 

		tcanvas = document.createElement( 'canvas' )
		tcanvas.width = @tmpCanvas.width
		tcanvas.height = @tmpCanvas.height
		tctx = tcanvas.getContext( '2d' )
		tctx.drawImage( @tmpCanvas, 0, 0, @tmpCanvas.width, @tmpCanvas.height )

		texture = new THREE.Texture( tcanvas )
		texture.minFilter = THREE.LinearFilter
		texture.magFilter = THREE.LinearFilter
		texture.wrapS = THREE.ClampToEdgeWrapping
		texture.wrapT = THREE.ClampToEdgeWrapping
		texture.needsUpdate = true

		@textures.push( texture )

		@frameCount++

		return



	@doImg = (img)=>

		@frame = @tmpCanvas.getContext('2d') unless @frame 

		ct = if img.lctFlag then img.lct else @hdr.gct

		cData = @frame.getImageData(img.leftPos, img.topPos, img.width, img.height)

		img.pixels.forEach( (pixel, i)=>
			if @transparency isnt pixel
				cData.data[i * 4 + 0] = ct[pixel][0]
				cData.data[i * 4 + 1] = ct[pixel][1]
				cData.data[i * 4 + 2] = ct[pixel][2]
				cData.data[i * 4 + 3] = 255
			else
				if @lastDisposalMethod is 2 or @lastDisposalMethod is 3
					cData.data[i * 4 + 3] = 0

			return
		)
		@frame.putImageData(cData, img.leftPos, img.topPos)
		return 


	@doNothing = =>










	@intro = =>

		@isIntroPlaying = true 

		$("#container").css({opacity:0})
		@camera.position.copy(@cameraFixPosFar)
		@cameraTarget.copy(@character.position)
		@cameraTarget.y += 100

		@prologueDiv = $("<div id='prologue_div'></p>")
		@prologueDiv.css({
			'font-size': '2vw'
			'text-align': 'center' 
			'line-height': 2
			'z-index': '20'
			'letter-spacing': '2px'
			'text-shadow': '1px 1px 3px rgba(0, 0, 0, 1.00)'
			'position':'absolute'
			'width': '50%'
			'height': '100px'
			'top':0
			'left':0
			'bottom':0
			'right':0
			'margin':'auto'
			'overflow':'visible'
			'opacity':0
		})

		@prologueDiv.html($('#prologue>p'))
		$(document.body).append(@prologueDiv)


		@scriptDiv = $("<div id='script_div'></p>")
		@scriptDiv.css({
			'font-size': '2vw'
			'position':'absolute'
			'width': '100%'
			'bottom': '25px'
			'text-align': 'center'
			'z-index': '20'
			'letter-spacing': '2px'
			'overflow':'visible'
		})
		@scriptDiv.addClass("text_outline")

		$("#container").append(@scriptDiv)

		scripts = $("#intro_script>p")
		getScript = (n)=>
			@scriptDiv.html(scripts[n])



		tl = new TimelineMax()


		@playAnimation('idle', true)

		tl.to( $("#intro"), 2, {autoAlpha:0, ease:Linear.easeNone} )

		# prologue
		tl.fromTo( @prologueDiv, 2, {autoAlpha:0}, {autoAlpha:1, ease:Linear.easeNone} )
		tl.to( @prologueDiv, 2, {autoAlpha:0, ease:Linear.easeNone}, "+=4" )


		# fade-in
		tl.to( $("#container"), 5, {alpha:1, ease:Linear.easeNone} )

		# camera move
		campos = @cameraTarget.clone()
		campos.sub(@camera.position)
		campos.normalize().multiplyScalar(400)
		campos.add(@camera.position)
		# @camera.position.lerp(campos, 0.4)
		@camera.position.x += 100
		@camera.position.y += 400
		@camera.position.z -= 500
		tl.to( @camera.position, 8, {x:campos.x, y:campos.y, z:campos.z, ease:Cubic.easeInOut}, "-=5" )

		# scripts

		tl.addLabel("script")
		tl.addCallback(getScript, "script+=1", [0] )
		tl.addCallback(getScript, "script+=3", [1] )
		tl.addCallback(getScript, "script+=8", [2] )
		tl.addCallback(@playAnimation, "script+=8", ["cold", false] )
		tl.addCallback(getScript, "script+=12", [3] )
		tl.addCallback(getScript, "script+=16", [4] )

		# move camera to fix position
		tl.addLabel('movecam')
		tl.to(@camera.position, 3, {x:@cameraBasePos.x, y:@cameraBasePos.y, z:@cameraBasePos.z, ease:Cubic.easeInOut}, 'movecam+0.5')
		tl.to(@cameraTarget, 3, {x:0, y:150, z:0, ease:Cubic.easeInOut}, 'movecam+=0.5')
		tl.to(@ctaSprite.material, 1, {opacity:1, ease:Linear.easeNone})

		# fist animation
		tl.addLabel('firsttry')
		firstAnim = =>
			TweenMax.to(@ctaSprite.material, 0.5, { opacity:0.3, ease:Linear.easeNone, repeat:-1, yoyo:true })
			@scriptDiv.remove()
			@isInteractive = true 
			@isCameraFree = true 
			@goIdle()

		tl.addCallback( firstAnim, "firsttry+=0.5")

		tl.timeScale(20)




	@intro2 = =>
		console.log 'intro2'

		@isInteractive = false
		@isCameraFree = false
		@onAnimationComplete = null 


		scripts = $("#intro_script2>p")
		getScript = (n)=>
			@scriptDiv.html(scripts[n])

		@scriptDiv.html("")
		$("#container").append(@scriptDiv)


		tl = new TimelineMax()

		# scripts
		tl.addLabel("script")
		tl.addCallback(getScript, "script", [0] )
		tl.addCallback(getScript, "script+=4", [1] )
		tl.addCallback(getScript, "script+=8", [2] )
		# tl.addCallback(getScript, "script+=12", [3] )

		tl.addCallback( =>
			@scriptDiv.remove()
			@isIntroPlaying = false 
			@isInteractive = true 
			@isCameraFree = true

			@ctaSprite.material.map = @ctaTextures[1]
			TweenMax.to(@ctaSprite.material, 1, {opacity:1, ease:Linear.easeNone, onComplete:=>
				TweenMax.to(@ctaSprite.material, 0.5, { opacity:0.3, ease:Linear.easeNone, repeat:-1, yoyo:true })
			})
			@goIdle()
		,"script+=12")

		tl.timeScale(20)


	@loadingSparkCounter = 0

	@initStage = =>



		@clock = new THREE.Clock()

		win_w = window.innerWidth
		win_h = window.innerHeight

		@camera = new THREE.PerspectiveCamera( 50, win_w / win_h, 1, 10000)
		# @camera.position.set(-240,150,600)
		@cameraTarget = new THREE.Vector3(0,0,0)

		@scene = new THREE.Scene()

		@renderer = new THREE.WebGLRenderer( { antialias: true })
		@renderer.setSize(win_w, win_h)
		@renderer.sortObject = true
		@renderer.shadowMapEnabled = true
		$('#container')[0].appendChild(@renderer.domElement)





		#character
		@scene.add(@character)

		# @scene.add(@helper)
		@character.rotation.y = 30*Math.PI/180
		@character.position.x = -180
		@character.castShadow = true
		@character.receiveShadow = false

		@character_match.position.copy(@character.position)
		@character_match.rotation.copy(@character.rotation)
		@character_match.scale.copy(@character.scale)
		@character_match.visible = false
		@character_match.castShadow = true
		@character_match.receiveShadow = false
		@scene.add(@character_match)


		# Match

		@matchHolder = new THREE.Object3D()
		@match.position.set(5,0,-25)
		@match.rotation.set(-Math.PI/2,0,-30*Math.PI/180)
		@match.scale.set(30,30,30)
		@matchHolder.add(@match)

		@scene.add(@matchHolder)
		@match.castShadow = true

		fireSprite = THREE.ImageUtils.loadTexture("img/match_fire.jpg")
		fireMat = new THREE.SpriteMaterial({
			map: fireSprite
			blending: THREE.AdditiveBlending
			useScreenCoordinates: false
			transparent: true
		})

		@fireMesh = new THREE.Sprite(fireMat)
		@fireMesh.scale.set(60,60,1)
		@fireMesh.visible = false 
		e = @match.rotation.clone()
		v = new THREE.Vector3(0,1,0)
		v.applyEuler(e)
		v.multiplyScalar(30)
		v.add(@match.position)
		

		@candleLight = new THREE.PointLight( 0xff9a30, 0, 700 )
		@candleLight.position.copy(v)

		@candleLight.add(@fireMesh)
		@matchHolder.add(@candleLight)



		# Loading spark
		@loadingSpark = new THREE.Object3D()
		@loadingPlanes = []
		plnGeom = new THREE.PlaneBufferGeometry(14,14,0,0)
		for txtr in @loadingSprites
			plnMat = new THREE.MeshBasicMaterial( {
				map:txtr 
				blending: THREE.AdditiveBlending
				side: THREE.DoubleSide
				transparent: true
				depthTest: false 
			})
			plnMesh = new THREE.Mesh(plnGeom, plnMat)
			@loadingPlanes.push(plnMesh)
			@loadingSpark.add(plnMesh)

		@loadingSpark.position.copy(v)
		@loadingSpark.visible = false 
		@matchHolder.add(@loadingSpark)


		# CTAs

		@ctaTextures = [
			THREE.ImageUtils.loadTexture("img/cta1.png")
			THREE.ImageUtils.loadTexture("img/cta2.png")
			THREE.ImageUtils.loadTexture("img/cta3.png")
		]

		ctaMaterial = new THREE.SpriteMaterial({
			map: @ctaTextures[0]
			useScreenCoordinates: false
			transparent: true
			opacity: 0
		})

		@ctaSprite = new THREE.Sprite(ctaMaterial)
		@ctaSprite.scale.set(520*0.5,120*0.5,1)
		@ctaSprite.position.copy(@character.position)
		@ctaSprite.position.y += 260
		@scene.add(@ctaSprite)




		# gifPlane

		@gifTextrue = new THREE.Texture()


		@gifMaterial = new THREE.MeshLambertMaterial({
			map: @gifTextrue
			color: 0x666666
			transparent: true
			blending: THREE.AdditiveBlending
			depthTest: true
		})

		geom = new THREE.PlaneBufferGeometry(100,100,10,10)
		@gifPlane = new THREE.Mesh(geom, @gifMaterial)
		@gifPlane.position.x = 60
		@gifPlane.position.y = 250
		@gifPlane.position.z = -125
		@scene.add(@gifPlane)


		# stage
		@stage.scale.set(30,30,30)
		@stage.receiveShadow = true
		@scene.add(@stage)

		geom = new THREE.BoxGeometry(90,135,3)
		mat = new THREE.MeshBasicMaterial({
			color:0xff0000
			opacity:0.0
			transparent:true
			depthTest:false
		})
		@poster1 = new THREE.Mesh(geom, mat)
		@poster1.position.set(340,158,-145)
		@scene.add(@poster1)

		@poster2 = new THREE.Mesh(geom, mat)
		@poster2.position.set(455,150,-145)
		@poster2.rotation.z = 0.2
		@scene.add(@poster2)



		# snow with shadermaterial
		particlesNum = 400

		attributes = {
			size: {type:'f', value:null}
		}

		uniforms = {
			time: {type:'f', value:0}
			color: { type: "c", value: new THREE.Color( 0xffffff ) }
			texture: {type:'t', value:THREE.ImageUtils.loadTexture('img/snowflake.png')}
		}

		snowMaterial = new THREE.ShaderMaterial({

			uniforms: uniforms
			attributes: attributes
			vertexShader: document.getElementById('vertexshader').textContent
			fragmentShader: document.getElementById('fragmentshader').textContent

			blending: THREE.AdditiveBlending
			depthTest: false
			transparent: true

		})



		# buffer geom
		snowGeom = new THREE.BufferGeometry()

		positions = new Float32Array(particlesNum*3)
		sizes = new Float32Array( particlesNum );


		v = 0
		while v<particlesNum
			sizes[v] = 40 + Math.random()*40
			positions[ v * 3 + 0 ] = ( Math.random() * 2 - 1 ) * 800
			positions[ v * 3 + 1 ] = ( Math.random() * 2 - 1 ) * 800
			positions[ v * 3 + 2 ] = -Math.random() * 800
			v++
		snowGeom.addAttribute('position', new THREE.BufferAttribute(positions, 3))
		snowGeom.addAttribute('size', new THREE.BufferAttribute(sizes, 1))

		@snow = new THREE.PointCloud(snowGeom, snowMaterial)
		@snow.position.z = @cameraFixPosFar.z 
		@scene.add(@snow)






		# spot lights
		@spotLight = new THREE.SpotLight(0xffd9ac, 1.5)
		@spotLight.position.set( 200, 500, 500)
		lightTarget = new THREE.Object3D()
		lightTarget.position.set(60,300,0)
		@scene.add(lightTarget)
		@spotLight.target = lightTarget

		@spotLight.castShadow = true
		@spotLight.shadowMapWidth = 1024
		@spotLight.shadowMapHeight = 1024
		@spotLight.shadowCameraNear = 200
		@spotLight.shadowCameraFar = 1500
		@spotLight.shadowBias = 0.0001
		@spotLight.shadowDarkness = 0.3

		@scene.add(@spotLight)



		# pointLight
		@pointLight = new THREE.PointLight(0x94b4ff, 1.4)
		@pointLight.position.set(0,500,350)
		@scene.add(@pointLight)


		# Ambient
		@ambientLight = new THREE.AmbientLight(@ambientColdColor)
		@scene.add(@ambientLight)




		# interactivity
		@raycaster = new THREE.Raycaster()
		@mouse = {x:0,y:0}

		$(document).on 'mousemove', @onMouseMove
		$(document.body).on 'touchmove', @onMouseMove



		$(document.body).on 'mousedown', @onClick
		$(document.body).on 'touchstart', @onTouch



		$(window).on 'resize', @layout

		@layout()

	@onMouseMove = (e)=>

		touches = e.originalEvent.touches || e.touches
		if touches
			@mouse.x = (touches[0].clientX / window.innerWidth)*2-1
			@mouse.y = -(touches[0].clientY / window.innerHeight)*2+1
		else
			@mouse.x = (e.clientX / window.innerWidth)*2-1
			@mouse.y = -(e.clientY / window.innerHeight)*2+1
			@detectObject(@mouse.x, @mouse.y)



	@mouseOverObject = null
	@detectObject = (x,y)=>
		# interaction
		vector = new THREE.Vector3( x, y, 1).unproject(@camera)
		@raycaster.set(@camera.position, vector.sub(@camera.position).normalize())
		intersects = raycaster.intersectObjects(@scene.children)
		if intersects.length>0 

			includeCharacter = false
			includeGifPlane = false 
			includePoster1 = false 
			includePoster2 = false 

			for a in intersects
				if a.object is @character then includeCharacter = true
				if a.object is @gifPlane then includeGifPlane = true
				if a.object is @poster1 then includePoster1 = true
				if a.object is @poster2 then includePoster2 = true


			if includeCharacter || includeGifPlane || includePoster1 || includePoster2

				if includeCharacter and not @isMouseOverGirl and @isInteractive
					document.body.style.cursor = 'pointer'
					@mouseOverObject = @character

				if includeGifPlane and not @isMouseOverGif and @gifIsloaded
					document.body.style.cursor = 'pointer'
					@mouseOverObject = @gifPlane

				if includePoster1
					document.body.style.cursor = 'pointer'
					@mouseOverObject = @poster1

				if includePoster2
					document.body.style.cursor = 'pointer'
					@mouseOverObject = @poster2

			else
				@mouseOverObject = null
				document.body.style.cursor = 'auto'



	@onTouch = (e)=>
		touches = e.originalEvent.touches || e.touches
		console.log e
		@mouse.x = (touches[0].clientX / window.innerWidth)*2-1
		@mouse.y = -(touches[0].clientY / window.innerHeight)*2+1
		@detectObject( @mouse.x, @mouse.y)
		@onClick() if not @isClicked

	@onClick = (e)=>

		e.preventDefault()

		# girl
		if @mouseOverObject is @character and @isInteractive
			
			@isInteractive = false
			document.body.style.cursor = 'auto'

			reloadGif()

		# gif
		else if @mouseOverObject is @gifPlane
			window.open( @gifPageUrl, "_blank" )

		# poster1
		else if @mouseOverObject is @poster1
			window.open( "http://giphy.com/", "_blank" )

		# poster2
		else if @mouseOverObject is @poster2
			window.open( "https://twitter.com/muroicci", "_blank" )




	@layout = =>
		win_w = window.innerWidth
		win_h = window.innerHeight
		h = win_w*9/16
		if(h>win_h) then h = win_h

		@camera.aspect = win_w / h
		@camera.updateProjectionMatrix()
		@renderer.setSize(win_w, h)
		$("#container").css({
			'position': 'absolute'
			'top':'50%'
			'margin-top':-h/2
		})






	@animate = =>
		requestAnimationFrame @animate

		# oonAnimationComplete
		if @currentAnimation and not @currentAnimation.isPlaying and not @animationComplete
			@animationComplete = true
			if @onAnimationComplete then @onAnimationComplete()

		@render()



	@counter = 0
	@now = Date.now()
	@then = Date.now()
	@interval = 1000/@gifFPS
	@delta  = 0

	@noise = new SimplexNoise()


	@render = =>

		elapsedTime = @clock.elapsedTime
		delta = @clock.getDelta()

		# camera
		if @isCameraFree
			@camPos.x = @cameraBasePos.x + @mouse.x*150
			@camPos.y = @cameraBasePos.y + @mouse.y*100
			@camPos.z = @cameraBasePos.z 
			@camera.position.add( @camPos.clone().sub(@camera.position).multiplyScalar(0.025) )

		@camera.lookAt( @cameraTarget )


		# animation
		THREE.AnimationHandler.update( delta )


		# calculate match position
		bone = @scene.getObjectByName("L_hand")
		pos = new THREE.Vector3()
		pos.setFromMatrixPosition(bone.matrixWorld)
		q = bone.getWorldQuaternion()
		@matchHolder.position.set(pos.x,pos.y,pos.z)
		@matchHolder.quaternion.copy(q)


		# limit fps to 5 fps for gif drawing
		@now = Date.now()
		@delta = @now - @then 

		if @delta > @interval and @gifIsloaded

			@then = @now - (@delta%@interval)
			@counter++

			if @counter >= @gifFrames
				@counter = 1

			if @isLightOn and @gifIsloaded
				txtr = @textures[@counter]
				@gifPlane.material.map = txtr 



		# light
		if @isLightOn
			v = @cangleLightIntensity + 0.4*Math.sin(@clock.getElapsedTime()*60)
			@candleLight.intensity = v
			@fireMesh.material.opacity = v
			@fireMesh.scale.y = v*50 - @blowMeter*Math.random()*10
			@fireMesh.material.rotation = (Math.random()*2-1)*@blowMeter*5*0.01745329251

			# loading
			if not @gifIsloaded

				@loadingSpark.lookAt(@matchHolder.position)
				far = -180
				overwrap = 10
				l = @loadingPlanes.length

				@loadingSparkCounter += 0.008
				if @loadingSparkCounter>1 + overwrap/l then @loadingSparkCounter = 0

				for pln,i in @loadingPlanes
					pln.rotation.x = Math.PI/2
					pln.rotation.z = Math.PI

					if @loadingSparkCounter <= i/l
						pln.position.set(0, 0, -Math.random()*30)
						pln.rotation.y = Math.PI/2
						pln.material.opacity = 0

					else 
						v = @map_range(@loadingSparkCounter, i/l, i/l+overwrap/l, 0, 1)
						plnv2 = pln.position.clone();
						plnv2.multiplyScalar(0.005 + i*0.00050)
						r = @noise.noise( plnv2.x, plnv2.z )
						pln.position.x = v*50*Math.sin( @loadingSparkCounter*Math.PI*2 ) + v*v*r*40
						pln.position.y = v*50*Math.cos( @loadingSparkCounter*Math.PI*2 ) + v*v*r*40
						pln.position.z = v*v * far + r*25 - 30

						pln.rotation.y = Math.sin(v*10)*1.0
						pln.rotation.x = Math.sin(v*i)*0.3 + Math.PI/2
						pln.rotation.z = Math.cos(v*i)*0.2 + Math.PI

						pln.material.opacity = (1 - v) * (Math.random()*0.5+0.5)


		# snow
		snowPositions = @snow.geometry.attributes.position.array

		i = 0
		l = snowPositions.length 
		while i<l

			snowPositions[i] += Math.sin( (elapsedTime + (i%3))*0.5 )*1.5
			
			i++
			if snowPositions[i] < -10 
				snowPositions[i] = 800 + Math.random()*800
			else
				snowPositions[i] -= 1 + (i%3)

			i++
			snowPositions[i] += Math.cos( (elapsedTime + (i%4))*0.4 )*1.0

			i++


		@snow.material.uniforms.time.value = elapsedTime
		@snow.geometry.attributes.position.needsUpdate = true;


		# render
		@renderer.render(@scene, @camera)






	@map_range = (value, low1, high1, low2, high2)->
    	return low2 + (high2 - low2) * (value - low1) / (high1 - low1)



	init()

	return 


















































function Picker(canvas) {
	this.plist = [];
	this.canvas = canvas;
	this.texture = null;
	this.framebuffer = null;
	this.renderbuffer = null;

	this.processHitsCallback = null;
	this.addHitCallback = null;
	this.removeHitCallback = null;
	this.hitPropertyCallback = null;
	this.moveCallback = null;

	this.configure();
}

Picker.prototype.update = function() {
	var width = this.canvas.width;
	var height = this.canvas.height;

	gl.bindTexture( gl.TEXTURE_2D, this.texture );
	gl.texImage2D( gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null );
	// gl.bindRender
}

Picker.prototype.configure = function() {
	var width = this.canvas.width;
	var height = this.canvas.height;

	this.texture = gl.createTexture();
	gl.bindTexture( gl.TEXTURE_2D, this.texture );
	gl.texImage2D( gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null );

	this.renderbuffer = gl.createRenderbuffer();
	gl.bindRenderbuffer( gl.RENDERBUFFER, this.renderbuffer );
	gl.renderbufferStorage( gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, width, height );

	this.framebuffer = gl.createFramebuffer();
	gl.bindFramebuffer( gl.FRAMEBUFFER, this.framebuffer );
	gl.framebufferTexture2D( gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.texture, 0 );
	gl.framebufferRenderbuffer( gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, this.renderbuffer );

	gl.bindTexture(gl.TEXTURE_2D,null);
	gl.bindRenderbuffer(gl.RENDERBUFFER,null);
	gl.bindFramebuffer(gl.FRAMEBUFFER,null);
};

Picker.prototype._compare = function(readout,color) {
	return (Math.abs(Math.round(color[0]*255) - readout[0]) <= 1 &&
			Math.abs(Math.round(color[1]*255) - readout[1]) <= 1 && 
			Math.abs(Math.round(color[2]*255) - readout[2]) <= 1);
}

Picker.prototype.find = function(coords) {
	var readout = new Uint8Array( 1*1*4 );
	gl.bindFramebuffer(gl.FRAMEBUFFER, this.framebuffer);
	gl.readPixels( coords.x, coords.y, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, readout );
	gl.bindFramebuffer(gl.FRAMEBUFFER, null);

	var found = false;

	if( this.hitPropertyCallback == undefined ) {
		alert("Needs an object property to perform the comparison");
		return;
	}

	for( var i=0; i<Scene.objects.length; i+=1 ) {
		var ob = Scene.objects[i];
		if(ob.alias == 'bg-plane') {
			continue;
		}
		var property = this.hitPropertyCallback(ob);

		if( property == undefined ) {
			continue;
		}

		if( this._compare( readout, property ) ) {
			var idx = this.plist.indexOf(ob);
			if( idx != -1 ) {
				this.plist.splice(idx,1);
				if( this.removeHitCallback ) {
					this.removeHitCallback(ob);
				}
			}else{
				this.plist.push(ob);
				if( this.addHitCallback ) {
					this.addHitCallback(ob);
				}
			}
			found = true;
			break;
		}
	}

	draw();
	return found;
};

Picker.prototype.stop = function() {
	if( this.processHitsCallback != null && this.plist.length>0 ) {
		this.processHitsCallback(this.plist);
	}
	this.plist = [];
};
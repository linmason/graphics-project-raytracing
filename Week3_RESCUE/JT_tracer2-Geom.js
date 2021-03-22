//3456789_123456789_123456789_123456789_123456789_123456789_123456789_123456789
// (JT: why the numbers? counts columns, helps me keep 80-char-wide listings,
//  lets me see EXACTLY what the editor's 'line-wrap' feature will do.)

//===  JT_tracer2-Geom.js  ===================================================
// The object prototypes here and in related files (and their comments):
//      JT_tracer0-Scene.js
//      JT_tracer1-Camera.js
//      JT_tracer3-ImgBuf.js
// are suitable for any and all features described in the Ray-Tracing Project 
// Assignment Sheet for EECS 351-2 Intermediate Computer Graphics.

//=============================================================================
// Allowable values for CGeom.shapeType variable.  Add some of your own!
const RT_GNDPLANE = 0;    // An endless 'ground plane' surface in xy plane
const RT_DISK     = 1;    // a circular disk in xy plane, radius 'diskRad'
const RT_SPHERE   = 2;    // A sphere, radius 1, centered at origin.
const RT_BOX      = 3;    // An axis-aligned cube, corners at (+/-1, +/-1,+/-1)
const RT_CYLINDER = 4;    // A cylinder with user-settable radius at each end
                        // and user-settable length.  radius of 0 at either
                        // end makes a cone; length of 0 with nonzero
                        // radius at each end makes a disk.
const RT_TRIANGLE = 5;    // a triangle with 3 vertices.
const RT_BLOBBY   = 6;    // Implicit surface:Blinn-style Gaussian 'blobbies'.

function CGeom(shapeSelect) {
//=============================================================================
// Generic object for a geometric shape, including its worldRay2model matrix
// used to transform any ray we wish to trace against it.
// Each instance describes just one shape, but you can select from several 
// different kinds of shapes by setting the 'shapeType' member.  CGeom can 
// describe ANY shape, including sphere, box, cone, quadric, etc. and it holds 
// all/any variables needed for each shapeType.
//
// Advanced Version: try it!
//        Ray tracing lets us position and distort these shapes in a new way;
// instead of transforming the shape itself for 'hit' testing against a traced
// ray, we transform the 3D ray by the matrix 'world2model' before a hit-test.
// This matrix simplifies our shape descriptions, because we don't need
// separate parameters for position, orientation, scale, or skew.  For example,
// RT_SPHERE and RT_BOX need NO parameters--they each describe a unit sphere or
// unit cube centered at the origin.  To get a larger, rotated, offset sphere
// or box, just set the parameters in world2model matrix. Note that you can 
// scale the box or sphere differently in different directions, forming 
// ellipsoids for the unit sphere and rectangles (or prisms) from the unit box.

	if(shapeSelect == undefined) shapeSelect = RT_GNDPLANE;	// default shape.
	this.shapeType = shapeSelect;

  // material index of the geometry MASON
  this.matlIndex = -1;
	
	// Get clever:  create 'traceMe()' function that calls the tracing function
	// needed by the shape held in this CGeom object.
	switch(this.shapeType) {
	  case RT_GNDPLANE: //--------------------------------------------------------
	    //set the ray-tracing function (so we call it using item[i].traceMe() )
	    this.traceMe = function(inR,hit) { this.traceGrid(inR,hit);   }; 
    	this.xgap = 1.0;	// line-to-line spacing
    	this.ygap = 1.0;
    	this.lineWidth = 0.1;	// fraction of xgap used for grid-line width
    	this.lineColor = vec4.fromValues(0.1,0.5,0.1,1.0);  // RGBA green(A==opacity)
    	this.gapColor = vec4.fromValues( 0.9,0.9,0.9,1.0);  // near-white
	    break;
	  case RT_DISK: //------------------------------------------------------------
	    //set the ray-tracing function (so we call it using item[i].traceMe() )
	    this.traceMe = function(inR,hit) { this.traceDisk(inR,hit);   };
	    this.diskRad = 2.0;   // default radius of disk centered at origin
    	// Disk line-spacing is set to 61/107 xgap,ygap  (ratio of primes)
    	// disk line-width is set to 3* lineWidth, and it swaps lineColor & gapColor. 
    	this.xgap = 61/107;	// line-to-line spacing: a ratio of primes.
    	this.ygap = 61/107;
    	this.lineWidth = 0.1;	// fraction of xgap used for grid-line width
    	this.lineColor = vec4.fromValues(0.1,0.5,0.1,1.0);  // RGBA green(A==opacity)
    	this.gapColor = vec4.fromValues( 0.9,0.9,0.9,1.0);  // near-white
	    break;
	  case RT_SPHERE: //----------------------------------------------------------
	    //set the ray-tracing function (so we call it using item[i].traceMe() )
	    this.traceMe = function(inR,hit) { this.traceSphere(inR,hit); }; 
    	this.lineColor = vec4.fromValues(0.0,0.3,1.0,1.0);  // RGBA blue(A==opacity)
	    break;
	  case RT_BOX:    //----------------------------------------------------------
	    //set the ray-tracing function (so we call it using item[i].traceMe() )
	    this.traceMe = function(inR,hit) { this.traceBox(inR,hit);    }; 
	    break;
	  case RT_CYLINDER://---------------------------------------------------------
	    //set the ray-tracing function (so we call it using item[i].traceMe() )
	    this.traceMe = function(inR,hit) { this.traceCyl(inR,hit);    }; 
	    break;
	  case RT_TRIANGLE://---------------------------------------------------------
	    //set the ray-tracing function (so we call it using item[i].traceMe() )
	    this.traceMe = function(inR,hit) { this.traceTri(inR,hit);    }; 
	    break;
	  case RT_BLOBBY://-----------------------------------------------------------
	    //set the ray-tracing function (so we call it using item[i].traceMe() )
	    this.traceMe = function(inR,hit) { this.traceBlobby(inR,hit); }; 
	    break;
	  default:
	    console.log("CGeom() constructor: ERROR! INVALID shapeSelect:", shapeSelect);
	    return;
	    break;
	}
	// Ray transform matrices.
	// Functions setIdent, rayTranslate(), rayRotate(), rayScale()
	//          set values for BOTH of these matrices:
	this.worldRay2model = mat4.create();  // the matrix used to transform rays 
	                                  // from world coord sys to model coord sys;
	                                  // This matrix sets shape size, position,
	                                  // orientation, and squash/stretch amount.
  this.normal2world = mat4.create();    // == worldRay2model^T
                                    // This matrix transforms MODEL-space
                                    // normals (where they're easy to find)
                                    // to WORLD-space coords (where we need
                                    // them for lighting calcs.)
	
}

CGeom.prototype.setIdent = function() {
//==============================================================================
// Discard worldRay2model contents, replace with identity matrix (world==model).
  mat4.identity(this.worldRay2model);  
  mat4.identity(this.normal2world);
}

CGeom.prototype.rayTranslate = function(x,y,z) {
//==============================================================================
//  Translate ray-tracing's current drawing axes (defined by worldRay2model),
//  by the vec3 'offV3' vector amount
  var a = mat4.create();   // construct INVERSE translation matrix [T^-1]
  a[12] = -x; // x  
  a[13] = -y; // y
  a[14] = -z; // z.
  //print_mat4(a,'translate()');
  mat4.multiply(this.worldRay2model,      // [new] =
                a, this.worldRay2model);  // =[T^-1]*[OLD]
  mat4.transpose(this.normal2world, this.worldRay2model); // model normals->world
}

CGeom.prototype.rayRotate = function(rad, ax, ay, az) {
//==============================================================================
// Rotate ray-tracing's current drawing axes (defined by worldRay2model) around
// the vec3 'axis' vector by 'rad' radians.
// (almost all of this copied directly from glMatrix mat4.rotate() function)
    var x = ax, y = ay, z = az,
        len = Math.sqrt(x * x + y * y + z * z),
        s, c, t,
        b00, b01, b02,
        b10, b11, b12,
        b20, b21, b22;
    if (Math.abs(len) < glMatrix.GLMAT_EPSILON) { 
      console.log("CGeom.rayRotate() ERROR!!! zero-length axis vector!!");
      return null; 
      }
    len = 1 / len;
    x *= len;
    y *= len;
    z *= len;

    s = Math.sin(-rad);     // INVERSE rotation; use -rad, not rad
    c = Math.cos(-rad);
    t = 1 - c;
    // Construct the elements of the 3x3 rotation matrix. b_rowCol
    // CAREFUL!  I changed something!!
    /// glMatrix mat4.rotate() function constructed the TRANSPOSE of the
    // matrix we want (probably because they used these b_rowCol values for a
    // built-in matrix multiply).
    // What we want is given in https://en.wikipedia.org/wiki/Rotation_matrix at
    //  the section "Rotation Matrix from Axis and Angle", and thus
    // I swapped the b10, b01 values; the b02,b20 values, the b21,b12 values.
    b00 = x * x * t + c;     b01 = x * y * t - z * s; b02 = x * z * t + y * s; 
    b10 = y * x * t + z * s; b11 = y * y * t + c;     b12 = y * z * t - x * s; 
    b20 = z * x * t - y * s; b21 = z * y * t + x * s; b22 = z * z * t + c;
    var b = mat4.create();  // build 4x4 rotation matrix from these
    b[ 0] = b00; b[ 4] = b01; b[ 8] = b02; b[12] = 0.0; // row0
    b[ 1] = b10; b[ 5] = b11; b[ 9] = b12; b[13] = 0.0; // row1
    b[ 2] = b20; b[ 6] = b21; b[10] = b22; b[14] = 0.0; // row2
    b[ 3] = 0.0; b[ 7] = 0.0; b[11] = 0.0; b[15] = 1.0; // row3
//    print_mat4(b,'rotate()');
    mat4.multiply(this.worldRay2model,      // [new] =
                  b, this.worldRay2model);  // [R^-1][old]
  mat4.transpose(this.normal2world, this.worldRay2model); // model normals->world

}

CGeom.prototype.rayScale = function(sx,sy,sz) {
//==============================================================================
//  Scale ray-tracing's current drawing axes (defined by worldRay2model),
//  by the vec3 'scl' vector amount
  if(Math.abs(sx) < glMatrix.GLMAT_EPSILON ||
     Math.abs(sy) < glMatrix.GLMAT_EPSILON ||
     Math.abs(sz) < glMatrix.GLMAT_EPSILON) {
     console.log("CGeom.rayScale() ERROR!! zero-length scale!!!");
     return null;
     }
  var c = mat4.create();   // construct INVERSE scale matrix [S^-1]
  c[ 0] = 1/sx; // x  
  c[ 5] = 1/sy; // y
  c[10] = 1/sz; // z.
//  print_mat4(c, 'scale()')'
  mat4.multiply(this.worldRay2model,      // [new] =
                c, this.worldRay2model);  // =[S^-1]*[OLD]
  mat4.transpose(this.normal2world, this.worldRay2model); // model normals->world
}

CGeom.prototype.traceGrid = function(inRay, myHit) {
//==============================================================================
// Find intersection of CRay object 'inRay' with grid-plane at z== 0, and
// if we find a ray/grid intersection CLOSER than CHit object 'hitMe', update
// the contents of 'hitMe' with all the new hit-point information.
// NO return value. 
// (old versions returned an integer 0,1, or -1: see hitMe.hitNum)
// Set CHit.hitNum ==  -1 if ray MISSES the disk
//                 ==   0 if ray hits the disk BETWEEN lines
//                 ==   1 if ray hits the disk ON the lines  

// HOW TO TRACE A GROUND-PLANE--------------------------------------------------
// 1) we parameterize the ray by 't', so that we can find any point on the
// ray by:
//          Ray(t) = ray.orig + t*ray.dir
// To find where the ray hit the plane, solve for t where Ray(t) = x,y,zGrid:
// Re-write:
//      Ray(t0).x = ray.orig[0] + t0*ray.dir[0] = x-value at hit-point (UNKNOWN!)
//      Ray(t0).y = ray.orig[1] + t0*ray.dir[1] = y-value at hit-point (UNKNOWN!)
//      Ray(t0).z = ray.orig[2] + t0*ray.dir[2] = zGrid    (we KNOW this one!)
//
//  solve for t0:   t0 = (zGrid - ray.orig[2]) / ray.dir[2]
//  From t0 we can find x,y value at the hit-point too.
//  Wait wait wait --- did we consider ALL possibilities?  No, not really:
//  If t0 <0, we can only hit the plane at points BEHIND our camera;
//  thus the ray going FORWARD through the camera MISSED the plane!.
//
// 2) Our grid-plane exists for all x,y, at the value z=zGrid, and is covered by
//    a grid of lines whose width is set by 'linewidth'.  The repeated lines of 
//    constant-x have spacing (repetition period) of xgap, and the lines of
//    constant-y have spacing of ygap.
//    GIVEN a hit-point (x,y,zGrid) on the grid-plane, find the color by:
//         if((x/xgap) has fractional part < linewidth  *OR*
//            (y/ygap) has fractional part < linewidth), you hit a line on
//            the grid. Use 'lineColor'.
//        otherwise, the ray hit BETWEEN the lines; use 'gapColor'

//------------------ Transform 'inRay' by this.worldRay2model matrx to make rayT
  var rayT = new CRay();    // create a local transformed-ray variable.
/*
//  FOR TESTING ONLY:
  vec4.copy(rayT.orig, inRay.orig);   // copy (if we're NOT going to transform grid)
  vec4.copy(rayT.dir, inRay.dir);
*/ 
  vec4.transformMat4(rayT.orig, inRay.orig, this.worldRay2model);
  vec4.transformMat4(rayT.dir,  inRay.dir,  this.worldRay2model);

  // Now use transformed ray 'rayT' for our ray-tracing.
//------------------End ray-transform.

  // find ray/grid-plane intersection: t0 == value where ray hits plane at z=0.
  var t0 = (-rayT.orig[2])/rayT.dir[2];    
    
  // The BIG QUESTION:  ? Did we just find a hit-point for inRay 
  // =================  ? that is CLOSER to camera than myHit?
  if(t0 < 0 || t0 > myHit.t0) {  
    return;   // NO. Hit-point is BEHIND us, or it's further away than myHit.
              // Leave myHit unchanged. Don't do any further calcs.   Bye!
  }
  // YES! we found a better hit-point!
  // Update myHit to describe it------------------------------------------------
  myHit.t0 = t0;             // record ray-length, and
  myHit.hitGeom = this;      // record the CGeom object that we hit, and
  // Compute the x,y,z,w point where rayT hit the grid-plane in MODEL coords:
                  // vec4.scaleAndAdd(out,a,b,scalar) sets out = a + b*scalar
  vec4.scaleAndAdd(myHit.modelHitPt, rayT.orig, rayT.dir, myHit.t0); 
  // (this is ALSO the world-space hit-point, because we have no transforms)
  vec4.copy(myHit.hitPt, myHit.modelHitPt);   // copy world-space hit-point.
/* or if you wish:
// COMPUTE the world-space hit-point:
  vec4.scaleAndAdd(myHit.HitPt, inRay.orig, inRay.dir, myHit.t0);
*/
  vec4.negate(myHit.viewN, inRay.dir);     // reversed, normalized inRay.dir:
  // ( CAREFUL! vec4.negate() changes sign of ALL components: x,y,z,w !!
  // inRay.dir MUST be a vector, not a point, to ensure w sign has no effect)
  vec4.normalize(myHit.viewN, myHit.viewN); // make view vector unit-length.
  vec4.set(myHit.surfNorm, 0,0,1,0);    // surface normal FIXED at world +Z.
/* or if you wish:
  // COMPUTE the surface normal:  (needed if you transformed the gnd-plane grid)
  // in model space we know it's always +z,
  // but we need to TRANSFORM the normal to world-space, & re-normalize it.
  vec4.transformMat4(myHit.surfNorm, vec4.fromValues(0,0,1,0), this.normal2world);
  vec4.normalize(myHit.surfNorm, myHit.surfNorm);
*/

  // FIND COLOR at model-space hit-point---------------------------------                        
  var loc = myHit.modelHitPt[0] / this.xgap; // how many 'xgaps' from the origin?
  if(myHit.modelHitPt[0] < 0) loc = -loc;    // keep >0 to form double-width line at yaxis.
//console.log("loc",loc, "loc%1", loc%1, "lineWidth", this.lineWidth);
  if(loc%1 < this.lineWidth) {    // fractional part of loc < linewidth? 
    myHit.hitNum =  1;            // YES. rayT hit a line of constant-x
    return;
  }
  loc = myHit.modelHitPt[1] / this.ygap;     // how many 'ygaps' from origin?
  if(myHit.modelHitPt[1] < 0) loc = -loc;    // keep >0 to form double-width line at xaxis.
  if(loc%1 < this.lineWidth) {    // fractional part of loc < linewidth? 
    myHit.hitNum =  1;            // YES. rayT hit a line of constant-y
    return;
  }
  myHit.hitNum = 0; // No.
  return;
}

CGeom.prototype.traceDisk = function(inRay, myHit) { 
//==============================================================================
// Find intersection of CRay object 'inRay' with a flat, circular disk in the
// xy plane, centered at the origin, with radius this.diskRad,
// and store the ray/disk intersection information on CHit object 'hitMe'.
// NO return value. 
// (old versions returned an integer 0,1, or -1: see hitMe.hitNum)
// Set CHit.hitNum ==  -1 if ray MISSES the disk
//                 ==   0 if ray hits the disk BETWEEN lines
//                 ==   1 if ray hits the disk ON the lines
//
//  Uses the EXACT SAME steps developed for this.traceGrid(), EXCEPT:
//  if the hit-point is > diskRad distance from origin, the ray MISSED the disk.

//------------------ Transform 'inRay' by this.worldRay2model matrix;
  var rayT = new CRay();    // create a local transformed-ray variable.
  vec4.copy(rayT.orig, inRay.orig);   // memory-to-memory copy. 
  vec4.copy(rayT.dir, inRay.dir);
                            // (DON'T do this: rayT = inRay; // that sets rayT
                            // as a REFERENCE to inRay. Any change to rayT is
                            // also a change to inRay (!!).
  vec4.transformMat4(rayT.orig, inRay.orig, this.worldRay2model);
  vec4.transformMat4(rayT.dir,  inRay.dir,  this.worldRay2model);
//------------------End ray-transform.

  // find ray/disk intersection: t0 == value where ray hits the plane at z=0.
  var t0 = -rayT.orig[2]/rayT.dir[2];   // (disk is in z==0 plane)  

  // The BIG QUESTION:  ? Did we just find a hit-point for inRay 
  // =================  ? that is CLOSER to camera than myHit?
  if(t0 < 0 || t0 > myHit.t0) {  
    return;   // NO. Hit-point is BEHIND us, or it's further away than myHit.
              // Leave myHit unchanged. Don't do any further calcs.   Bye!
  }
  // OK, so we hit the plane at (model space) z==0;
  // ? But did we hit the disk itself?
  // compute the x,y,z,w point where inRay hit the grid-plane in MODEL coords:
  // vec4.scaleAndAdd(out,a,b,scalar) sets out = a + b*scalar
  var modelHit = vec4.create();
  vec4.scaleAndAdd(modelHit, rayT.orig, rayT.dir, t0); 
  if(modelHit[0]*modelHit[0] + modelHit[1]*modelHit[1]  
        > this.diskRad*this.diskRad)  {     // ?Did ray hit within disk radius?
    return;   // NO.  Ray MISSED the disk.
              // Leave myHit unchanged. Don't do any further calcs. Bye!
  }
  // YES! we found a better hit-point!
  // Update myHit to describe it------------------------------------------------
  myHit.t0 = t0;             // record ray-length, and
  myHit.hitGeom = this;      // record this CGeom object as the one we hit, and
  vec4.copy(myHit.modelHitPt, modelHit);  // record the model-space hit-pt, and
  // compute the x,y,z,w point where inRay hit the grid-plane in WORLD coords:
  vec4.scaleAndAdd(myHit.hitPt, inRay.orig, inRay.dir, myHit.t0);
  // set 'viewN' member to the reversed, normalized inRay.dir vector:
  vec4.negate(myHit.viewN, inRay.dir);     
  // ( CAREFUL! vec4.negate() changes sign of ALL components: x,y,z,w !!
  // inRay.dir MUST be a vector, not a point, to ensure w sign has no effect)
  vec4.normalize(myHit.viewN, myHit.viewN); // ensure a unit-length vector.
  // Now find surface normal: 
  // in model space we know it's always +z,
  // but we need to TRANSFORM the normal to world-space, & re-normalize it.
  vec4.transformMat4(myHit.surfNorm, vec4.fromValues(0,0,1,0), this.normal2world);
  vec4.normalize(myHit.surfNorm, myHit.surfNorm);
  
//-------------find hit-point color:----------------
  var loc = myHit.modelHitPt[0] / this.xgap;// how many 'xgaps' from the origin?
  if(myHit.modelHitPt[0] < 0) loc = -loc;   // keep >0 to form double-width line at yaxis.
  if(loc%1 < this.lineWidth) {    // fractional part of loc < linewidth? 
    myHit.hitNum =  0;            // YES. rayT hit a line of constant-x
    return;
  }
  loc = myHit.modelHitPt[1] / this.ygap;    // how many 'ygaps' from origin?
  if(myHit.modelHitPt[1] < 0) loc = -loc;   // keep >0 to form double-width line at xaxis.
  if(loc%1 < this.lineWidth) {  // fractional part of loc < linewidth? 
    myHit.hitNum = 0;           // YES. rayT hit a line of constant-y
    return;
  }
  myHit.hitNum = 1;         // No.
  return;
}

CGeom.prototype.traceSphere = function(inRay, myHit) { 
//==============================================================================
// Find intersection of CRay object 'inRay' with sphere of radius 1 centered at
// the origin in the 'model' coordinate system. 
//
// (If you want different a radius, position, orientation or scaling in the
// world coordinate system, use the ray-transforming functions, 
//  e.g. rayTranslate(), rayRotate(), ...)

// (old versions returned an integer 0,1, or -1: see hitMe.hitNum)
// Set CHit.hitNum ==  -1 if ray MISSES the sphere;
//                 ==   0 if ray hits the sphere BELOW z==0 equator,
//                 ==   1 if ray hits the sphere ABOVE z==0 equator.

  // DIAGNOSTIC:----------------------------------------------------------------
/*
  if(g_myScene.pixFlag ==1) {   // did we reach the one 'flagged' pixel
                                // chosen in CScene.makeRayTracedImage()?
  console.log("you called CGeom.traceSphere");  // YES!
  }
*/
  // END DIAGNOSTIC:------------------------------------------------------------
 
// Half-Chord Method===================
//(see Ray-Tracing Lecture Notes D)
//for finding ray/sphere intersection
//=====================================
//------------------ Step 1: transform 'inRay' by this.worldRay2model matrix;
  var rayT = new CRay();    // to create 'rayT', our local model-space ray.
  vec4.copy(rayT.orig, inRay.orig);   // memory-to-memory copy. 
  vec4.copy(rayT.dir, inRay.dir);
                            // (DON'T do this: rayT = inRay; // that sets rayT
                            // as a REFERENCE to inRay. Any change to rayT is
                            // also a change to inRay (!!).
  vec4.transformMat4(rayT.orig, inRay.orig, this.worldRay2model);
  vec4.transformMat4(rayT.dir,  inRay.dir,  this.worldRay2model);
  
//------------------ Step 2: Test 1st triangle. Did ray MISS sphere entirely?
  // Create r2s vector that reaches FROM ray's start-point TO the sphere center.
  //  (subtract: model-space origin POINT - rayT origin POINT):
  // (remember, in homogeneous coords w=1 for points, =0 for vectors)
  var r2s = vec4.create();
  vec4.subtract(r2s, vec4.fromValues(0,0,0,1), rayT.orig);
  // Find L2, the squared length of r2s, by dot-product with itself:
  var L2 = vec3.dot(r2s,r2s);   // NOTE: vec3.dot() IGNORES the 'w' values when 
                                //  vec4 arguments.  !Good! I like glMatrix...
  // if L2 <=1.0, ray starts AT or INSIDE the unit sphere surface (!). 
  if(L2 <= 1.0) { // report error and quit.  LATER we can use this case to
                  // handle rays through transparent spheres.
    console.log("CGeom.traceSphere() ERROR! rayT origin at or inside sphere!\n\n");
    return;       // HINT: see comments at end of this function.
  }
  // We now know L2 > 1.0; ray starts OUTSIDE the sphere.
  // Now consider the path of rayT in model coords. It will either:
  //  MISS the sphere entirely, or HIT the sphere at 2 points. Lets name the
  // the line-segment of the ray between those 2 points as the 'chord', and note
  // that the chord's mid-point is special; it is the point along the ray that 
  // is closest to the sphere's center.
  // At this chord midpoint, we define the rayT length as == tca.  
  // Before we find tca, let's find a SCALED VERSION of tca, called 'tcaS'.
  //      If we KNOW that rayT.dir is unit-length, then we could find tca by 
  // taking the dot-product of rayT.dir & r2S, but we DON'T know -- so let's
  // define the as-yet-unknown length of rayT.dir as 'length(tdir)'.  What we
  // *DO* know is that tcaS == tca*length(tdir).  Let's find tcaS first:
  var tcaS = vec3.dot(rayT.dir, r2s); // tcaS == SCALED tca;
  
  if(tcaS < 0.0) {      // Is the chord mid-point BEHIND the camera(where t<0)?
    return;             // YES!  rayT didn't start inside the sphere, so if
    // MISSED!          // the chord mid-point is behind the camera, then
  }                     // the entire chord is behind the camera: NO hit-points!
                        // Don't change myHit, don't do any further calcs. Bye!
                        // Don't change myHit hMISS! sphere is BEHIND the ray! 
						// No hit points. Bye!
  
  // STEP 3: Measure 1st triangle-----------------------------------------------
  // For the next step we need tca^2, without the scale factor imposed by any
  // non-unit-length tdir.  (tca*length(tdir))^2 = tca^2 * length(tdir)^2,
  // so we can find tca^2 without the (costly) square-root:
  var DL2 = vec3.dot(rayT.dir, rayT.dir);
  var tca2 = tcaS*tcaS / DL2;

  // Next, use the Pythagorean theorem to find LM2; the squared distance from
  // sphere center to chord mid-point:  L2 = LM2 + tca2, so LM2 = L2-tca2;
  var LM2 = L2 - tca2;  
  if(LM2 > 1.0) {   // if LM2 > radius^2, then chord mid-point is OUTSIDE the
                    // sphere entirely.  Once again, our ray MISSED the sphere.
    return;         // DON'T change myHit, don't do any further calcs. Bye!
    // MISSED!
  }
  //     ***IF*** you're tracing a shadow ray you can stop right here: we know
  // that this ray's path to the light-source is blocked by this CGeom object.

  // STEP 4: Measure 2nd triangle-----------------------------------------------
  // Still here? then LM2 must be <= 1.0; the ray hits the sphere at 2 points 
  // in front of us.  Let's find those hit-points by again using the Pythagorean 
  // theorem on a 2nd triangle contained entirely within the sphere.
  //    Form a right-triangle within the sphere--the 90-degree corner is at the
  // chord midpoint, and its legs extend to the sphere center and to one of
  // the ray's 2 hit-points. The triangle's hypotenuse is just the sphere's
  // radius (==1). One leg's squared length is LM2 (chord midpoint to sphere 
  // center) and the other leg is the 'half-chord', with length Lhc. Pythagoras:
  //  LM2 + Lhc*Lhc = r^2 = 1.0 or Lhc*Lhc = (1.0 - LM2) == L2hc
  var L2hc = (1.0 - LM2); // SQUARED half-chord length.
  
  // STEP 5: Measure RAY using 2nd triangle-------------------------------------
  // COOL! the **ray-length** at hit-points are = tca +/- sqrt(L2hc)!
  //  But wait--we want something else:
  //      --we want the t value for those hit-points, and
  //      --we must do it WITHOUT normalizing tdir (and that's important)!
  //        ASIDE: We simply CAN'T normalize tdir; that would change the 
  //               t-values of the points where the ray hits the sphere in the 
  //               'model' coord. sys. We need those non-normalized t values 
  //                because we use them again on the world-space version of our 
  //                ray (e.g. inRay) to find the world-space hit-point. We
  //                then use the world-space hit-point to find shadows, shading,
  //                transparency, texture, and more.
  // Algebra finds our t values:
  // Lets find **ray-length** in terms of the desired value t:
  //    **ray-length** = tca +/- sqrt(L2hc), and
  //    **ray-length** = t * length(tdir), and DL2 = (length(tdir))^2.
  //   Solve for t: 
  //      t = **ray-length** /length(tdir) = **ray-length** /sqrt(DL2)
  //        = (tca +/- sqrt(L2hc)) / sqrt(DL2)
  //        = tca/sqrt(DL2) +/- sqrt(L2hc/DL2)
  //        Recall that tcaS = tca*length(tdir) = tca*sqrt(DL2), so
  //                  tcaS/DL2 = tca*sqrt(DL2) / (sqrt(DL2)*sqrt(DL2))
  //                           =          tca / sqrt(DL2)  and thus:
  //      ====================================
  //      t0hit = tcaS/DL2 - sqrt(L2hc/DL2)
  //      t1hit = tcaS/DL2 + sqrt(L2hc/DL2)
  //      ====================================
  //  We know both hit-points are in front of ray, thus t0hit >0 and t1hit >0.
  //  We also know that Math.sqrt() always returns values >=0, and thus
  // we know the hit-point NEAREST the ray's origin MUST be t0hit. 
  var t0hit = tcaS/DL2 -Math.sqrt(L2hc/DL2);  // closer of the 2 hit-points.
  if(t0hit > myHit.t0) {    // is this new hit-point CLOSER than 'myHit'?
    return;       // NO.  DON'T change myHit, don't do any further calcs. Bye!
  }
  // YES! we found a better hit-point!
  // Update myHit to describe it------------------------------------------------
  myHit.t0 = t0hit;          // record ray-length, and
  myHit.hitGeom = this;      // record this CGeom object as the one we hit, and
  // Compute the x,y,z,w point where rayT hit the sphere in MODEL coords:
                  // vec4.scaleAndAdd(out,a,b,scalar) sets out = a + b*scalar
  vec4.scaleAndAdd(myHit.modelHitPt, rayT.orig, rayT.dir, myHit.t0); 
  // Compute the x,y,z,w point where inRay hit the grid-plane in WORLD coords:
  vec4.scaleAndAdd(myHit.hitPt, inRay.orig, inRay.dir, myHit.t0);
  // set 'viewN' member to the reversed, normalized inRay.dir vector:
  vec4.negate(myHit.viewN, inRay.dir); 
  // ( CAREFUL! vec4.negate() changes sign of ALL components: x,y,z,w !!
  // inRay.dir MUST be a vector, not a point, to ensure w sign has no effect)
  vec4.normalize(myHit.viewN, myHit.viewN); // ensure a unit-length vector.
  // Now find surface normal: 
  // in model space we know it's always +z,
  // but we need to TRANSFORM the normal to world-space, & re-normalize it.
  vec4.transformMat4(myHit.surfNorm, vec4.fromValues(0,0,1,0), this.normal2world);
  vec4.normalize(myHit.surfNorm, myHit.surfNorm);
  // TEMPORARY: sphere color-setting
  myHit.hitNum = 1;   // in CScene.makeRayTracedImage, use 'this.gapColor'
 
   // DIAGNOSTIC:---------------------------------------------------------------
  if(g_myScene.pixFlag ==1) {   // did we reach the one 'flagged' pixel
                                // chosen in CScene.makeRayTracedImage()?
  console.log("r2s:", r2s, "L2", L2, "tcaS", tcaS, "tca2", tca2, 
              "LM2", LM2, "L2hc", L2hc, "t0hit", t0hit, );  // YES!
  }
  // END DIAGNOSTIC:------------------------------------------------------------
 
  // FOR LATER:
  // If the ray begins INSIDE the sphere (because L2 < radius^2),
    //      ====================================
    //      t0 = tcaS/DL2 - sqrt(L2hc/DL2)  // NEGATIVE; behind the ray start pt
    //      t1 = tcaS/DL2 + sqrt(L2hc/DL2)  // POSITIVE: in front of ray origin.
    //      ====================================
    //  Use the t1 hit point, as only t1 is AHEAD of the ray's origin.
}


function CMatl(matlType) {
  this.K_emit = [];     // DISCARD any current material reflectance values.
  this.K_ambi = [];
  this.K_diff = [];
  this.K_spec = [];
  this.K_name = [];
  this.K_shiny = 0.0;

  var MATL_RED_PLASTIC =    1;
  var MATL_GRN_PLASTIC =    2;
  var MATL_BLU_PLASTIC =    3;
  var MATL_BLACK_PLASTIC =  4;
  var MATL_BLACK_RUBBER =   5;
  var MATL_BRASS =          6;
  var MATL_BRONZE_DULL =    7;
  var MATL_BRONZE_SHINY =   8;
  var MATL_CHROME =         9;
  var MATL_COPPER_DULL =   10;
  var MATL_COPPER_SHINY =  11;
  var MATL_GOLD_DULL =     12;
  var MATL_GOLD_SHINY =    13;
  var MATL_PEWTER =        14;
  var MATL_SILVER_DULL =   15;
  var MATL_SILVER_SHINY =  16;
  var MATL_EMERALD =       17;
  var MATL_JADE =          18;
  var MATL_OBSIDIAN =      19;
  var MATL_PEARL =         20;
  var MATL_RUBY =          21;
  var MATL_TURQUOISE =     22;
  var MATL_DEFAULT =       23;    // (used for unrecognized material names)

  if(   matlType && matlType >=0 && matlType < MATL_DEFAULT)  {   
    console.log("New Material" + matlType);
  }
  else {
    return;
  }

  //  Set new values ONLY for material reflectances:
  switch(matlType)
  {
    case MATL_RED_PLASTIC: // 1
      this.K_emit.push(0.0,     0.0,    0.0,    1.0);
      this.K_ambi.push(0.1,     0.1,    0.1,    1.0);
      this.K_diff.push(0.6,     0.0,    0.0,    1.0);
      this.K_spec.push(0.6,     0.6,    0.6,    1.0);   
      this.K_shiny = 100.0;
      this.K_name = "MATL_RED_PLASTIC";
      break;
    case MATL_GRN_PLASTIC: // 2
      this.K_emit.push(0.0,     0.0,    0.0,    1.0);
      this.K_ambi.push(0.05,    0.05,   0.05,   1.0);
      this.K_diff.push(0.0,     0.6,    0.0,    1.0);
      this.K_spec.push(0.2,     0.2,    0.2,    1.0);   
      this.K_shiny = 60.0;
      this.K_name = "MATL_GRN_PLASTIC";
      break;
    case MATL_BLU_PLASTIC: // 3
      this.K_emit.push(0.0,     0.0,    0.0,    1.0);
      this.K_ambi.push(0.05,    0.05,   0.05,   1.0);
      this.K_diff.push(0.0,     0.2,    0.6,    1.0);
      this.K_spec.push(0.1,     0.2,    0.3,    1.0);   
      this.K_shiny = 5.0;
      this.K_name = "MATL_BLU_PLASTIC";
      break;
    case MATL_BLACK_PLASTIC:
      this.K_emit.push(0.0,     0.0,    0.0,    1.0);
      this.K_ambi.push(0.0,     0.0,    0.0,    1.0);
      this.K_diff.push(0.01,    0.01,   0.01,   1.0);
      this.K_spec.push(0.5,     0.5,    0.5,    1.0);   
      this.K_shiny = 32.0;
      this.K_name = "MATL_BLACK_PLASTIC";
      break;
    case MATL_BLACK_RUBBER:
      this.K_emit.push(0.0,     0.0,    0.0,    1.0);
      this.K_ambi.push(0.02,    0.02,   0.02,   1.0);
      this.K_diff.push(0.01,    0.01,   0.01,   1.0);
      this.K_spec.push(0.4,     0.4,    0.4,    1.0);   
      this.K_shiny = 10.0;
      this.K_name = "MATL_BLACK_RUBBER";
      break;
    case MATL_BRASS:
      this.K_emit.push(0.0,      0.0,      0.0,      1.0);
      this.K_ambi.push(0.329412, 0.223529, 0.027451, 1.0);
      this.K_diff.push(0.780392, 0.568627, 0.113725, 1.0);
      this.K_spec.push(0.992157, 0.941176, 0.807843, 1.0);   
      this.K_shiny = 27.8974;
      this.K_name = "MATL_BRASS";
      break;
    case MATL_BRONZE_DULL:
      this.K_emit.push(0.0,      0.0,      0.0,      1.0);
      this.K_ambi.push(0.2125,   0.1275,   0.054,    1.0);
      this.K_diff.push(0.714,    0.4284,   0.18144,  1.0);
      this.K_spec.push(0.393548, 0.271906, 0.166721, 1.0);  
      this.K_shiny = 25.6;
      this.K_name = "MATL_BRONZE_DULL";
      break;
    case MATL_BRONZE_SHINY:
      this.K_emit.push(0.0,      0.0,      0.0,      1.0);
      this.K_ambi.push(0.25,     0.148,    0.06475,  1.0);
      this.K_diff.push(0.4,      0.2368,   0.1036,   1.0);
      this.K_spec.push(0.774597, 0.458561, 0.200621, 1.0);  
      this.K_shiny = 76.8;
      this.K_name = "MATL_BRONZE_SHINY";
      break;
    case MATL_CHROME:
      this.K_emit.push(0.0,      0.0,      0.0,      1.0);
      this.K_ambi.push(0.25,     0.25,     0.25,     1.0);
      this.K_diff.push(0.4,      0.4,      0.4,      1.0);
      this.K_spec.push(0.774597, 0.774597, 0.774597, 1.0);  
      this.K_shiny = 76.8;
      this.K_name = "MATL_CHROME";
      break;
    case MATL_COPPER_DULL:
      this.K_emit.push(0.0,      0.0,      0.0,      1.0);
      this.K_ambi.push(0.19125,  0.0735,   0.0225,   1.0);
      this.K_diff.push(0.7038,   0.27048,  0.0828,   1.0);
      this.K_spec.push(0.256777, 0.137622, 0.086014, 1.0);  
      this.K_shiny = 12.8;
      this.K_name = "MATL_COPPER_DULL";
      break;
    case MATL_COPPER_SHINY:
      this.K_emit.push(0.0,      0.0,      0.0,       1.0);
      this.K_ambi.push(0.2295,   0.08825,  0.0275,    1.0);
      this.K_diff.push(0.5508,   0.2118,   0.066,     1.0);
      this.K_spec.push(0.580594, 0.223257, 0.0695701, 1.0);  
      this.K_shiny = 51.2;
      this.K_name = "MATL_COPPER_SHINY";
      break;
    case MATL_GOLD_DULL:
      this.K_emit.push(0.0,      0.0,      0.0,      1.0);
      this.K_ambi.push(0.24725,  0.1995,   0.0745,   1.0);
      this.K_diff.push(0.75164,  0.60648,  0.22648,  1.0);
      this.K_spec.push(0.628281, 0.555802, 0.366065, 1.0);  
      this.K_shiny = 51.2;
      this.K_name = "MATL_GOLD_DULL";
      break;
    case MATL_GOLD_SHINY:
      this.K_emit.push(0.0,      0.0,      0.0,      1.0);
      this.K_ambi.push(0.24725,  0.2245,   0.0645,   1.0);
      this.K_diff.push(0.34615,  0.3143,   0.0903,   1.0);
      this.K_spec.push(0.797357, 0.723991, 0.208006, 1.0);  
      this.K_shiny = 83.2;
      this.K_name = "MATL_GOLD_SHINY";
      break;
    case MATL_PEWTER:
      this.K_emit.push(0.0,      0.0,      0.0,      1.0);
      this.K_ambi.push(0.105882, 0.058824, 0.113725, 1.0);
      this.K_diff.push(0.427451, 0.470588, 0.541176, 1.0);
      this.K_spec.push(0.333333, 0.333333, 0.521569, 1.0);  
      this.K_shiny = 9.84615;
      this.K_name = "MATL_PEWTER";
      break;
    case MATL_SILVER_DULL:
      this.K_emit.push(0.0,      0.0,      0.0,      1.0);
      this.K_ambi.push(0.19225,  0.19225,  0.19225,  1.0);
      this.K_diff.push(0.50754,  0.50754,  0.50754,  1.0);
      this.K_spec.push(0.508273, 0.508273, 0.508273, 1.0);  
      this.K_shiny = 51.2;
      this.K_name = "MATL_SILVER_DULL";
      break;
    case MATL_SILVER_SHINY:
      this.K_emit.push(0.0,      0.0,      0.0,      1.0);
      this.K_ambi.push(0.23125,  0.23125,  0.23125,  1.0);
      this.K_diff.push(0.2775,   0.2775,   0.2775,   1.0);
      this.K_spec.push(0.773911, 0.773911, 0.773911, 1.0);  
      this.K_shiny = 89.6;
      this.K_name = "MATL_SILVER_SHINY";
      break;
    case MATL_EMERALD:
      this.K_emit.push(0.0,     0.0,      0.0,     1.0);
      this.K_ambi.push(0.0215,  0.1745,   0.0215,  0.55);
      this.K_diff.push(0.07568, 0.61424,  0.07568, 0.55);
      this.K_spec.push(0.633,   0.727811, 0.633,   0.55);   
      this.K_shiny = 76.8;
      this.K_name = "MATL_EMERALD";
      break;
    case MATL_JADE:
      this.K_emit.push(0.0,      0.0,      0.0,      1.0);
      this.K_ambi.push(0.135,    0.2225,   0.1575,   0.95);
      this.K_diff.push(0.54,     0.89,     0.63,     0.95);
      this.K_spec.push(0.316228, 0.316228, 0.316228, 0.95);   
      this.K_shiny = 12.8;
      this.K_name = "MATL_JADE";
      break;
    case MATL_OBSIDIAN:
      this.K_emit.push(0.0,      0.0,      0.0,      1.0);
      this.K_ambi.push(0.05375,  0.05,     0.06625,  0.82);
      this.K_diff.push(0.18275,  0.17,     0.22525,  0.82);
      this.K_spec.push(0.332741, 0.328634, 0.346435, 0.82);   
      this.K_shiny = 38.4;
      this.K_name = "MATL_OBSIDIAN";
      break;
    case MATL_PEARL:
      this.K_emit.push(0.0,      0.0,      0.0,      1.0);
      this.K_ambi.push(0.25,     0.20725,  0.20725,  0.922);
      this.K_diff.push(1.0,      0.829,    0.829,    0.922);
      this.K_spec.push(0.296648, 0.296648, 0.296648, 0.922);   
      this.K_shiny = 11.264;
      this.K_name = "MATL_PEARL";
      break;
    case MATL_RUBY:
      this.K_emit.push(0.0,      0.0,      0.0,      1.0);
      this.K_ambi.push(0.1745,   0.01175,  0.01175,  0.55);
      this.K_diff.push(0.61424,  0.04136,  0.04136,  0.55);
      this.K_spec.push(0.727811, 0.626959, 0.626959, 0.55);   
      this.K_shiny = 76.8;
      this.K_name = "MATL_RUBY";
      break;
    case MATL_TURQUOISE: // 22
      this.K_emit.push(0.0,      0.0,      0.0,      1.0);
      this.K_ambi.push(0.1,      0.18725,  0.1745,   0.8);
      this.K_diff.push(0.396,    0.74151,  0.69102,  0.8);
      this.K_spec.push(0.297254, 0.30829,  0.306678, 0.8);   
      this.K_shiny = 12.8;
      this.K_name = "MATL_TURQUOISE";
      break;
    default:
      // ugly featureless (emissive-only) red:
      this.K_emit.push(0.5, 0.0, 0.0, 1.0); // DEFAULT: ugly RED emissive light only
      this.K_ambi.push(0.0, 0.0, 0.0, 1.0); // r,g,b,alpha  ambient reflectance
      this.K_diff.push(0.0, 0.0, 0.0, 1.0); //              diffuse reflectance
      this.K_spec.push(0.0, 0.0, 0.0, 1.0); //              specular reflectance
      this.K_shiny = 1.0;       // Default (don't set specular exponent to zero!)
      this.K_name = "DEFAULT_RED";
      break;
  }
  console.log('set to:', this.K_name, '\n');
  return this;
}


function CLight(pos, ia, id, is) {
  this.pos = pos;
  this.ia = ia;
  this.id = id;
  this.is = is;
  this.isOn = true;
}

CLight.prototype.setPos = function(pos) { 
  this.pos = pos;
}

CLight.prototype.enable = function() { 
  this.isOn = true;
}

CLight.prototype.disable = function() { 
  this.isOn = false;
}


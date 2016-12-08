/*
 * To change this template, choose Tools | Templates
 * and open the template in the editor.
 */
package volvis;

import com.jogamp.opengl.GL;
import com.jogamp.opengl.GL2;
import com.jogamp.opengl.util.texture.Texture;
import com.jogamp.opengl.util.texture.awt.AWTTextureIO;
import gui.RaycastRendererPanel;
import gui.TransferFunction2DEditor;
import gui.TransferFunctionEditor;
import java.awt.image.BufferedImage;
import util.TFChangeListener;
import util.VectorMath;
import volume.GradientVolume;
import volume.Volume;
import volume.VoxelGradient;

/**
 *
 * @author michel
 */
public class RaycastRenderer extends Renderer implements TFChangeListener {
    public enum RenderMode 
    {
        SLICE,
        MIP,
        COMPOSITION,
        TRANSFER2D,
        SHADED
    }
    
    private RenderMode renderMode = RenderMode.SLICE;
    private Volume volume = null;
    private GradientVolume gradients = null;
    private double[] firstViewVec = null;
    
    // Quality settings
    private int rotSamples = 30;
    private int staticSamples = 300;
    private int downscaleRatio = 2;     
    
    // Illumination constants
    private double kAmbient = 0.1;
    private double kDiffuse = 0.7;
    private double kSpec = 0.2;
    private double specAlpha = 10;
    
    RaycastRendererPanel panel;
    TransferFunction tFunc;
    TransferFunctionEditor tfEditor;
    TransferFunction2DEditor tfEditor2D;
    
    public RaycastRenderer() {
        panel = new RaycastRendererPanel(this);
        panel.setSpeedLabel("0");
    }

    public void setRenderMode(RenderMode rm)
    {
        renderMode = rm;
    }
    
    public void setVolume(Volume vol) {
        System.out.println("Assigning volume");
        volume = vol;

        System.out.println("Computing gradients");
        gradients = new GradientVolume(vol);

        // set up image for storing the resulting rendering
        // the image width and height are equal to the length of the volume diagonal
        int imageSize = (int) Math.floor(Math.sqrt(vol.getDimX() * vol.getDimX() + vol.getDimY() * vol.getDimY()
                + vol.getDimZ() * vol.getDimZ()));
        if (imageSize % 2 != 0) {
            imageSize = imageSize + 1;
        }
        image = new BufferedImage(imageSize, imageSize, BufferedImage.TYPE_INT_ARGB);
        // create a standard TF where lowest intensity maps to black, the highest to white, and opacity increases
        // linearly from 0.0 to 1.0 over the intensity range
        tFunc = new TransferFunction(volume.getMinimum(), volume.getMaximum());
        
        // uncomment this to initialize the TF with good starting values for the orange dataset 
        //tFunc.setTestFunc();
        tFunc.addTFChangeListener(this);
        tfEditor = new TransferFunctionEditor(tFunc, volume.getHistogram());
        
        tfEditor2D = new TransferFunction2DEditor(volume, gradients);
        tfEditor2D.addTFChangeListener(this);

        System.out.println("Finished initialization of RaycastRenderer");
    }
    
    public RaycastRendererPanel getPanel() {
        return panel;
    }

    public TransferFunction2DEditor getTF2DPanel() {
        return tfEditor2D;
    }
    
    public TransferFunctionEditor getTFPanel() {
        return tfEditor;
    }
    
    /**
     * Tests whether a ray intersects a bounded plane and at which point
     * @param intersectPoint (out) The intersection point (only valid when the function returns true)
     * @param vec A ray vector
     * @param plane A bounded plane
     * @return true if the ray intersects the plane, false otherwise
     */
    boolean getPlaneIntersection(double[] intersectPoint, double[] vec, double[] plane)
    {
        // We define a small eps to deal with floating point issues
        double eps = 0.000001;
        
        double[] vecA = new double[3];
        double[] vecB = new double[3];
        double[] vecC = new double[3];
        
        VectorMath.setVector(vecA, plane[0], plane[1], plane[2]);
        VectorMath.setVector(vecB, plane[3], plane[4], plane[5]);
        VectorMath.setVector(vecC, plane[6], plane[7], plane[8]);
        
        double[] vecAB = {(vecA[0] - vecB[0]), 
                          (vecA[1] - vecB[1]), 
                          (vecA[2] - vecB[2])};
        double[] vecBC = {(vecB[0] - vecC[0]), 
                          (vecB[1] - vecC[1]), 
                          (vecB[2] - vecC[2])};
        
        double[] planeNormal = new double[3];
        
        planeNormal = VectorMath.crossproduct(vecAB, vecBC);
        
        double d = -((planeNormal[0] * vecA[0]) + (planeNormal[1] * vecA[1]) + (planeNormal[2] * vecA[2]));
        double[] planeEq = {planeNormal[0], planeNormal[1], planeNormal[2], d};
        double t = -planeEq[3] / ((planeEq[0] * vec[0]) + (planeEq[1] * vec[1]) + (planeEq[2] * vec[2]));
        
        intersectPoint[0] = vec[0] * t;
        intersectPoint[1] = vec[1] * t;
        intersectPoint[2] = vec[2] * t;
        
        // Check whether the intersection point lies within the boundaries of the plane
        if (intersectPoint[0] >= plane[0] - eps && intersectPoint[0] <= plane[6] + eps &&
            intersectPoint[1] >= plane[1] - eps && intersectPoint[1] <= plane[7] + eps &&
            intersectPoint[2] >= plane[2] - eps && intersectPoint[2] <= plane[8] + eps)
        {
            return true;
        }
        return false;
    }
    
    /**
     * This function calculates the 2 intersection points q0 and q1 
     * @param q0 (out) The first intersection point along the viewing ray
     * @param q1 (out) The last intersection point along the viewing ray
     * @param vec The view vector
     */
    void getIntersectionPoints(double[] q0, double[] q1, double[] vec)
    {
        double[][] planes = {{-volume.getDimX() / 2.0, -volume.getDimY() / 2.0, volume.getDimZ() / 2.0,
                            -volume.getDimX() / 2.0, volume.getDimY() / 2.0, volume.getDimZ() / 2.0,
                            volume.getDimX() / 2.0, volume.getDimY() / 2.0, volume.getDimZ() / 2.0,
                            volume.getDimX() / 2.0, -volume.getDimY() / 2.0, volume.getDimZ() / 2.0},
                          {-volume.getDimX() / 2.0, -volume.getDimY() / 2.0, -volume.getDimZ() / 2.0,
                            -volume.getDimX() / 2.0, volume.getDimY() / 2.0, -volume.getDimZ() / 2.0,
                            volume.getDimX() / 2.0, volume.getDimY() / 2.0, -volume.getDimZ() / 2.0,
                            volume.getDimX() / 2.0, -volume.getDimY() / 2.0, -volume.getDimZ() / 2.0},
                          {volume.getDimX() / 2.0, -volume.getDimY() / 2.0, -volume.getDimZ() / 2.0,
                            volume.getDimX() / 2.0, -volume.getDimY() / 2.0, volume.getDimZ() / 2.0,
                            volume.getDimX() / 2.0, volume.getDimY() / 2.0, volume.getDimZ() / 2.0,
                            volume.getDimX() / 2.0, volume.getDimY() / 2.0, -volume.getDimZ() / 2.0},
                          {-volume.getDimX() / 2.0, -volume.getDimY() / 2.0, -volume.getDimZ() / 2.0,
                            -volume.getDimX() / 2.0, -volume.getDimY() / 2.0, volume.getDimZ() / 2.0,
                            -volume.getDimX() / 2.0, volume.getDimY() / 2.0, volume.getDimZ() / 2.0,
                            -volume.getDimX() / 2.0, volume.getDimY() / 2.0, -volume.getDimZ() / 2.0},
                          {-volume.getDimX() / 2.0, volume.getDimY() / 2.0, -volume.getDimZ() / 2.0,
                            -volume.getDimX() / 2.0, volume.getDimY() / 2.0, volume.getDimZ() / 2.0,
                            volume.getDimX() / 2.0, volume.getDimY() / 2.0, volume.getDimZ() / 2.0,
                            volume.getDimX() / 2.0, volume.getDimY() / 2.0, -volume.getDimZ() / 2.0},
                          {-volume.getDimX() / 2.0, -volume.getDimY() / 2.0, -volume.getDimZ() / 2.0,
                            -volume.getDimX() / 2.0, -volume.getDimY() / 2.0, volume.getDimZ() / 2.0,
                            volume.getDimX() / 2.0, -volume.getDimY() / 2.0, volume.getDimZ() / 2.0,
                            volume.getDimX() / 2.0, -volume.getDimY() / 2.0, -volume.getDimZ() / 2.0}};
        
        double[] intersectionPoint = new double[3];
        boolean firstFound = false;
        
        double[] p0 = new double[3];
        double[] p1 = new double[3];

        for(int i = 0; i < 6; i++)
        {
            
            if (getPlaneIntersection(intersectionPoint, vec, planes[i]))
            {
                if (!firstFound)
                {
                    VectorMath.setVector(p0, intersectionPoint[0], intersectionPoint[1], intersectionPoint[2]);
                    firstFound = true;
                }
                else
                {
                    VectorMath.setVector(p1, intersectionPoint[0], intersectionPoint[1], intersectionPoint[2]);
                }
            }
        }
        
        // Check whether the vector direction matches the viewvector such that q0 is always the first point encountered
        if(Math.signum(p1[0]) == Math.signum(vec[0]))
        {
            VectorMath.setVector(q0, p0[0], p0[1], p0[2]);
            VectorMath.setVector(q1, p1[0], p1[1], p1[2]);
        }
        else
        {
            VectorMath.setVector(q0, p1[0], p1[1], p1[2]);
            VectorMath.setVector(q1, p0[0], p0[1], p0[2]);
        }
    }
    
    /**
     * Used to obtain a VoxelGradient instance for intermediate coordinate values (non integer) using the technique of tri-linear interpolation
     * @param coord The non-integer coordinates
     * @return The interpolated VoxelGradient instance
     */
    VoxelGradient getVoxelGradient(double[] coord) 
    {
        if (coord[0] < 0 || Math.ceil(coord[0]) >= volume.getDimX() || coord[1] < 0 || Math.ceil(coord[1]) >= volume.getDimY()
                || coord[2] < 0 || Math.ceil(coord[2]) >= volume.getDimZ()) {
            return new VoxelGradient(0.0f, 0.0f, 0.0f);
        }

        // Take floor and ceil values for every axis and calculate our interpolation variables (alpha, beta and gamma)
        int xF = (int) Math.floor(coord[0]);
        int xC = (int) Math.ceil(coord[0]);
        
        double alpha = (coord[0] - xF) / (xC - xF);
        
        int yF = (int) Math.floor(coord[1]);
        int yC = (int) Math.ceil(coord[1]);
        
        double beta = (coord[1] - yF) / (yC - yF);
        
        int zF = (int) Math.floor(coord[2]);
        int zC = (int) Math.ceil(coord[2]);
        
        double gamma = (coord[2] - zF) / (zC - zF);
        
        // Look up the corner values of our interpolation cube
        VoxelGradient v0 = gradients.getGradient(xF, yF, zF);
        VoxelGradient v1 = gradients.getGradient(xC, yF, zF);
        VoxelGradient v2 = gradients.getGradient(xF, yC, zF);
        VoxelGradient v3 = gradients.getGradient(xC, yC, zF);
        VoxelGradient v4 = gradients.getGradient(xF, yF, zC);
        VoxelGradient v5 = gradients.getGradient(xC, yF, zC);
        VoxelGradient v6 = gradients.getGradient(xF, yC, zC);
        VoxelGradient v7 = gradients.getGradient(xC, yC, zC);
        
        // Perform tri-linear interpolation for (x, y and z) values 
        float xLerp = (float)(
                (1-alpha) * (1-beta) * (1-gamma) * v0.x +
                alpha * (1-beta) * (1-gamma) * v1.x +
                (1-alpha) * beta * (1-gamma) * v2.x +
                alpha * beta * (1-gamma) * v3.x +
                (1-alpha) * (1-beta) * gamma * v4.x +
                alpha * (1-beta) * gamma * v5.x +
                (1-alpha) * beta * gamma * v6.x +
                alpha * beta * gamma * v7.x);
        
        
        float yLerp = (float)(
                (1-alpha) * (1-beta) * (1-gamma) * v0.y +
                alpha * (1-beta) * (1-gamma) * v1.y +
                (1-alpha) * beta * (1-gamma) * v2.y +
                alpha * beta * (1-gamma) * v3.y +
                (1-alpha) * (1-beta) * gamma * v4.y +
                alpha * (1-beta) * gamma * v5.y +
                (1-alpha) * beta * gamma * v6.y +
                alpha * beta * gamma * v7.y);
        
        
        float zLerp = (float)(
                (1-alpha) * (1-beta) * (1-gamma) * v0.z +
                alpha * (1-beta) * (1-gamma) * v1.z +
                (1-alpha) * beta * (1-gamma) * v2.z +
                alpha * beta * (1-gamma) * v3.z +
                (1-alpha) * (1-beta) * gamma * v4.z +
                alpha * (1-beta) * gamma * v5.z +
                (1-alpha) * beta * gamma * v6.z +
                alpha * beta * gamma * v7.z);
        
        // Return our interpolated voxel gradient
        return new VoxelGradient(xLerp, yLerp, zLerp);
    }

    /**
     * Used to obtain an intensity value for intermediate coordinate values (non integer) using the technique of tri-linear interpolation
     * @param coord The non-integer coordinates
     * @return The interpolated intensity value
     */
    short getVoxel(double[] coord) 
    {
        if (coord[0] < 0 || Math.ceil(coord[0]) >= volume.getDimX() || coord[1] < 0 || Math.ceil(coord[1]) >= volume.getDimY()
                || coord[2] < 0 || Math.ceil(coord[2]) >= volume.getDimZ()) {
            return 0;
        }

        // Take floor and ceil values for every axis and calculate our interpolation variables (alpha, beta and gamma)
        int xF = (int) Math.floor(coord[0]);
        int xC = (int) Math.ceil(coord[0]);
        
        double alpha = (coord[0] - xF) / (xC - xF);
        
        int yF = (int) Math.floor(coord[1]);
        int yC = (int) Math.ceil(coord[1]);
        
        double beta = (coord[1] - yF) / (yC - yF);
        
        int zF = (int) Math.floor(coord[2]);
        int zC = (int) Math.ceil(coord[2]);
        
        double gamma = (coord[2] - zF) / (zC - zF);
       
        // Look up the corner values of our interpolation cube
        short v0 = volume.getVoxel(xF, yF, zF);
        short v1 = volume.getVoxel(xC, yF, zF);
        short v2 = volume.getVoxel(xF, yC, zF);
        short v3 = volume.getVoxel(xC, yC, zF);
        short v4 = volume.getVoxel(xF, yF, zC);
        short v5 = volume.getVoxel(xC, yF, zC);
        short v6 = volume.getVoxel(xF, yC, zC);
        short v7 = volume.getVoxel(xC, yC, zC);
        
        // Perform tri-linear interpolation
        short result = (short)(
                (1-alpha) * (1-beta) * (1-gamma) * v0 +
                alpha * (1-beta) * (1-gamma) * v1 +
                (1-alpha) * beta * (1-gamma) * v2 +
                alpha * beta * (1-gamma) * v3 +
                (1-alpha) * (1-beta) * gamma * v4 +
                alpha * (1-beta) * gamma * v5 +
                (1-alpha) * beta * gamma * v6 +
                alpha * beta * gamma * v7);
                
        return result;
    }

 
    
    /**
     * Takes a slice directly through the middle of the volume
     * @param pixelCoord Pixel coordinates
     * @param max Maximum intensity value
     * @return The color for the specified pixel
     */
    TFColor slicer(double[] pixelCoord, double max)
    {
        TFColor voxelColor = new TFColor();

        int val = getVoxel(pixelCoord);

        // Map the intensity to a grey value by linear scaling
        voxelColor.r = val / max;
        voxelColor.g = voxelColor.r;
        voxelColor.b = voxelColor.r;
        voxelColor.a = val > 0 ? 1.0 : 0.0;  // this makes intensity 0 completely transparent and the rest opaque

        return voxelColor;
    }
    
    TFColor maximalIntenstityProjection(double[] pixelCoord, double[] q0, double[] q1, double max) 
    { 
        TFColor voxelColor = new TFColor();

        int maxVal = 0;
        int val = 0;
        
        int k = (interactiveMode) ? rotSamples : staticSamples;
        
        double[] coord = new double[3];
        
        for(int l = 1; l < k; l++)
        {
            double[] r = VectorMath.lerp(q0, q1, (double)l/(double)k);
           
            coord[0] = pixelCoord[0] + r[0];
            coord[1] = pixelCoord[1] + r[1];
            coord[2] = pixelCoord[2] + r[2];

            val = getVoxel(coord);

            maxVal = Math.max(val, maxVal);
        }

        val = maxVal;
               
        // Map the intensity to a grey value by linear scaling
        voxelColor.r = val / max;
        voxelColor.g = voxelColor.r;
        voxelColor.b = voxelColor.r;
        voxelColor.a = val > 0 ? 1.0 : 0.0;  // this makes intensity 0 completely transparent and the rest opaque

        return voxelColor;
    }
    
    /**
     * 
     * @param pixelCoord
     * @param q0
     * @param q1
     * @return 
     */
    TFColor composition(double[] pixelCoord, double[] q0, double[] q1)
    {     
        TFColor voxelColor = new TFColor();

        int val = 0;

        int k = (interactiveMode) ? rotSamples : staticSamples;

        TFColor col;
        TFColor newCol;

        voxelColor.r = 0.0;
        voxelColor.g = 0.0;
        voxelColor.b = 0.0;
        voxelColor.a = 0.0;
        
        double[] coord = new double[3];
        
        for(int l = 1; l < k; l++)
        {
            // Calculate slice offset
            double[] r = VectorMath.lerp(q0, q1, (double)l/(double)k);

            coord[0] = pixelCoord[0] + r[0];
            coord[1] = pixelCoord[1] + r[1];
            coord[2] = pixelCoord[2] + r[2];

            val = getVoxel(coord);
            col = tFunc.getColor(val);

            newCol = new TFColor();
            newCol.r = col.r * col.a + (1-col.a) * voxelColor.r;
            newCol.g = col.g * col.a + (1-col.a) * voxelColor.g;
            newCol.b = col.b * col.a + (1-col.a) * voxelColor.b;
            voxelColor = newCol;  
        }
        
        return voxelColor;
    }
    
    TFColor Transfer2d(double[] pixelCoord, double[] q0, double[] q1, double[] viewVec, boolean shaded) 
    {         
        TFColor voxelColor = new TFColor();
        
        int val = 0;
        VoxelGradient grad = null;
        
        double opacity = 0.0;
        
        double[] viewNormalized = new double[3];
        VectorMath.setVector(viewNormalized, viewVec[0], viewVec[1], viewVec[2]);
        VectorMath.normalizeVector(viewVec);

        int k = (interactiveMode) ? rotSamples : staticSamples;

        TFColor col = new TFColor();
        TFColor newCol;
        voxelColor.r = 0.0;
        voxelColor.g = 0.0;
        voxelColor.b = 0.0;
        voxelColor.a = 0.0;

        double[] coord = new double[3];
        
        for(int l = 1; l < k; l++)
        {
            double[] r = VectorMath.lerp(q0, q1, (double)l/(double)k);

            coord[0] = pixelCoord[0] + r[0];
            coord[1] = pixelCoord[1] + r[1];
            coord[2] = pixelCoord[2] + r[2];

            val = getVoxel(coord);
            grad = getVoxelGradient(coord);
            
            //For each trianglewidget
            double maxGradMag = tfEditor2D.maxGradientMagnitude;
            double minGradMagInput = tfEditor2D.triangleWidget.minGradMagnitude;
            double maxGradMagInput = tfEditor2D.triangleWidget.maxGradMagnitude;
            if (grad.mag == 0 && val == tfEditor2D.triangleWidget.baseIntensity)
            {
                opacity = 1;
            }
            else if (grad.mag > 0 && 
                    ((val - (tfEditor2D.triangleWidget.radius * grad.mag)) <= tfEditor2D.triangleWidget.baseIntensity &&
                    tfEditor2D.triangleWidget.baseIntensity <= (val + (tfEditor2D.triangleWidget.radius * grad.mag))) &&
                    grad.mag <= (maxGradMagInput * maxGradMag) && grad.mag >= (minGradMagInput * maxGradMag))
            {
                opacity = 1 - ((1/tfEditor2D.triangleWidget.radius) * Math.abs((tfEditor2D.triangleWidget.baseIntensity - val)/grad.mag));
            }
            else
            {
                opacity = 0;
            }

            col.r = tfEditor2D.triangleWidget.color.r;
            col.g = tfEditor2D.triangleWidget.color.g;
            col.b = tfEditor2D.triangleWidget.color.b;
            
            
            if (shaded && opacity > 0)
            {
                TFColor iAmb = new TFColor(1.0, 1.0, 1.0, 1.0);
                iAmb.r *= kAmbient;
                iAmb.g *= kAmbient;
                iAmb.b *= kAmbient;

                double[] normal = new double[3];
                VectorMath.setVector(normal, (grad.x / grad.mag), (grad.y / grad.mag), (grad.z / grad.mag));
                double LDotN = VectorMath.dotproduct(viewVec, normal);
                double diffValid = Math.max(Math.signum(LDotN), 0);

                TFColor iDiff = col;
                iDiff.r *= kDiffuse * LDotN * diffValid;
                iDiff.g *= kDiffuse * LDotN * diffValid;
                iDiff.b *= kDiffuse * LDotN * diffValid;

                double NDotH = VectorMath.dotproduct(normal, viewNormalized);
                double spec = kSpec * Math.pow(NDotH, specAlpha);

                double specValid = Math.max(Math.signum(NDotH), 0);

                TFColor iSpec = new TFColor(1.0, 1.0, 1.0, 1.0);
                iSpec.r *= spec * specValid;
                iSpec.g *= spec * specValid;
                iSpec.b *= spec * specValid;


                col.r = iAmb.r + iDiff.r + iSpec.r;
                col.g = iAmb.g + iDiff.g + iSpec.g;
                col.b = iAmb.b + iDiff.b + iSpec.b;

            }

            newCol = new TFColor();
            newCol.r = col.r * opacity + (1-opacity) * voxelColor.r;
            newCol.g = col.g * opacity + (1-opacity) * voxelColor.g;
            newCol.b = col.b * opacity + (1-opacity) * voxelColor.b;
            voxelColor = newCol;  
            //End For each
        }
        
        return voxelColor;
    }
    
    /**
     * Creates an image of the volume data, supports multiple render modes
     * @param viewMatrix The view matrix
     */
    void createImage(double[] viewMatrix)
    {
        // clear image
        for (int j = 0; j < image.getHeight(); j++) {
            for (int i = 0; i < image.getWidth(); i++) {
                image.setRGB(i, j, 0);
            }
        }

        // vector uVec and vVec define a plane through the origin, 
        // perpendicular to the view vector viewVec
        double[] viewVec = new double[3];
        double[] uVec = new double[3];
        double[] vVec = new double[3];
        VectorMath.setVector(viewVec, viewMatrix[2], viewMatrix[6], viewMatrix[10]);
        VectorMath.setVector(uVec, viewMatrix[0], viewMatrix[4], viewMatrix[8]);
        VectorMath.setVector(vVec, viewMatrix[1], viewMatrix[5], viewMatrix[9]);
        
        // get q0 and q1
        double[] q0 = new double[3];
        double[] q1 = new double[3];
        getIntersectionPoints(q0, q1, viewVec);
        
        double max = volume.getMaximum();
        
        // image is square
        int imageCenter = image.getWidth() / 2;

        double[] pixelCoord = new double[3];
        double[] volumeCenter = new double[3];
        VectorMath.setVector(volumeCenter, volume.getDimX() / 2 , volume.getDimY() / 2, volume.getDimZ() / 2);

        // sample on a plane through the origin of the volume data
        TFColor voxelColor = new TFColor();

        int step = (interactiveMode) ? downscaleRatio : 1;
        
        for (int j = 0; j < image.getHeight(); j+= step) 
        {
            for (int i = 0; i < image.getWidth(); i+= step) 
            {
                pixelCoord[0] = uVec[0] * (i - imageCenter) + vVec[0] * (j - imageCenter) + volumeCenter[0];
                pixelCoord[1] = uVec[1] * (i - imageCenter) + vVec[1] * (j - imageCenter) + volumeCenter[1];
                pixelCoord[2] = uVec[2] * (i - imageCenter) + vVec[2] * (j - imageCenter) + volumeCenter[2];
                
                // Calculate pixelcolor for this specific rendermode
                switch(renderMode)
                {
                   case MIP:
                        voxelColor = maximalIntenstityProjection(pixelCoord, q0, q1, max);
                        break;
                    case COMPOSITION:
                        voxelColor = composition(pixelCoord, q0, q1);
                        break;
                    case TRANSFER2D:
                        voxelColor = Transfer2d(pixelCoord, q0, q1, viewVec, false);
                        break;
                    case SHADED:
                        voxelColor = Transfer2d(pixelCoord, q0, q1, viewVec, true);
                        break;
                    default:
                        voxelColor = slicer(pixelCoord, max);
                        break;
                    }
                
                int c_alpha = voxelColor.a <= 1.0 ? (int) Math.floor(voxelColor.a * 255) : 255;
                int c_red = voxelColor.r <= 1.0 ? (int) Math.floor(voxelColor.r * 255) : 255;
                int c_green = voxelColor.g <= 1.0 ? (int) Math.floor(voxelColor.g * 255) : 255;
                int c_blue = voxelColor.b <= 1.0 ? (int) Math.floor(voxelColor.b * 255) : 255;
                int pixelColor = (c_alpha << 24) | (c_red << 16) | (c_green << 8) | c_blue;
                                
                image.setRGB(i, j, pixelColor);
            }
        }
        
        // Since we are not using the full resolution, it would be nice to interpolate between the values that we did calculate
        if(interactiveMode)
        {
            for (int j = 0; j < image.getHeight() - step; j++) 
            {
                for (int i = 0; i < image.getWidth() - step; i++) 
                {
                    int iMod = (i % step);
                    int jMod = (j % step);
                    
                    // We can skip the values we calculated before
                    if(iMod == 0 && jMod == 0)
                        continue;
                                            
                    // bi-linear interpolation
                    // Take floor and ceil values for every axis and calculate our interpolation variables (alpha, beta)                        
                    int xL = (int) i - iMod;
                    int xH = (int) i + step - iMod;

                    double alpha = (double)(i - xL) / (double)(xH - xL);

                    int yL = (int) j - jMod;
                    int yH = (int) j + step - jMod;

                    double beta = (double)(j - yL) / (double)(yH - yL);

                    // Look up the corner values of our interpolation cube
                    int x0 = image.getRGB(xL, yL);
                    int x1 = image.getRGB(xH, yL);
                    int x2 = image.getRGB(xL, yH);
                    int x3 = image.getRGB(xH, yH);

                    // Expand back to rgba using bitmasks 
                    int rMask = 0x00FF0000;
                    int gMask = 0x0000FF00;
                    int bMask = 0x000000FF;
                    int aMask = 0xFF000000;
                                 
                    TFColor c0 = new TFColor((double)((x0 & rMask) >> 16) / 255.0, (double)((x0 & gMask) >> 8) / 255.0, (double)(x0 & bMask) / 255.0, (double)((x0 & aMask) >> 24) / 255.0);
                    TFColor c1 = new TFColor((double)((x1 & rMask) >> 16) / 255.0, (double)((x1 & gMask) >> 8) / 255.0, (double)(x1 & bMask) / 255.0, (double)((x1 & aMask) >> 24) / 255.0);
                    TFColor c2 = new TFColor((double)((x2 & rMask) >> 16) / 255.0, (double)((x2 & gMask) >> 8) / 255.0, (double)(x2 & bMask) / 255.0, (double)((x2 & aMask) >> 24) / 255.0);
                    TFColor c3 = new TFColor((double)((x3 & rMask) >> 16) / 255.0, (double)((x3 & gMask) >> 8) / 255.0, (double)(x3 & bMask) / 255.0, (double)((x3 & aMask) >> 24) / 255.0);
                    
                    // Perform bi-linear interpolation for (r, g, b and a) values 
                    double rLerp = (double)(
                        (1-alpha) * (1-beta) * c0.r +
                        alpha * (1-beta) * c1.r +
                        (1-alpha) * beta * c2.r +
                        alpha * beta * c3.r);
                    
                    double gLerp = (double)(
                        (1-alpha) * (1-beta) * c0.g +
                        alpha * (1-beta) * c1.g +
                        (1-alpha) * beta * c2.g +
                        alpha * beta * c3.g);
                                        
                    double bLerp = (double)(
                        (1-alpha) * (1-beta) * c0.b +
                        alpha * (1-beta) * c1.b +
                        (1-alpha) * beta * c2.b +
                        alpha * beta * c3.b);                   
                    
                    double aLerp = (double)(
                        (1-alpha) * (1-beta) * c0.a +
                        alpha * (1-beta) * c1.a +
                        (1-alpha) * beta * c2.a +
                        alpha * beta * c3.a);

                    // Set image color
                    int c_alpha = aLerp <= 1.0 ? (int) Math.floor(aLerp * 255) : 255;
                    int c_red = rLerp <= 1.0 ? (int) Math.floor(rLerp * 255) : 255;
                    int c_green = gLerp <= 1.0 ? (int) Math.floor(gLerp * 255) : 255;
                    int c_blue = bLerp <= 1.0 ? (int) Math.floor(bLerp * 255) : 255;
                    int pixelColor = (c_alpha << 24) | (c_red << 16) | (c_green << 8) | c_blue;
                    
                    image.setRGB(i, j, pixelColor);
                }
            }
        }
    }
    
   

    /**
     * Function used to debug ray-plane intersections
     * @param gl GL instance
     */
    private void drawDebug(GL2 gl) {
        gl.glPushAttrib(GL2.GL_CURRENT_BIT);
        gl.glDisable(GL2.GL_LIGHTING);
        gl.glColor4d(1.0, 0.5, 0.5, 1.0);
        gl.glLineWidth(1.5f);
        gl.glEnable(GL.GL_LINE_SMOOTH);
        gl.glHint(GL.GL_LINE_SMOOTH_HINT, GL.GL_NICEST);
        gl.glEnable(GL.GL_BLEND);
        gl.glBlendFunc(GL.GL_SRC_ALPHA, GL.GL_ONE_MINUS_SRC_ALPHA);
        
        if(firstViewVec != null)
        {
            // Pick q0 and q1
            double[] q0 = new double[3];
            double[] q1 = new double[3];
            //VectorMath.setVector(q1, -firstViewVec[0], -firstViewVec[1], -firstViewVec[2]);
            //double[] r = VectorMath.lerp(q0, q1, 0.25);
            getIntersectionPoints(q0, q1, firstViewVec);
            gl.glBegin(GL.GL_LINES);
//            gl.glVertex3d(firstViewVec[0] * 400.0 , firstViewVec[1] * 400.0, firstViewVec[2] * 400.0);
//            gl.glVertex3d(-firstViewVec[0] * 400.0, -firstViewVec[1] * 400.0, -firstViewVec[2] * 400.0);
            gl.glVertex3d(q0[0] , q0[1], q0[2]);
            gl.glVertex3d(q1[0], q1[1], q1[2]);
            gl.glEnd();
            
            gl.glPointSize(5.0f);
            gl.glColor4d(1.0, 1.0, 0.4, 1.0);

            gl.glBegin(GL.GL_POINTS);
            gl.glVertex3d(q0[0] , q0[1], q0[2]);
            gl.glColor4d(1.0, 0.0, 1.0, 1.0);
            gl.glVertex3d(q1[0], q1[1], q1[2]);
//            gl.glVertex3d(r[0], r[1], r[2]);
//           // gl.glVertex3d(0,0,0);
            gl.glEnd();

        }

        gl.glDisable(GL.GL_LINE_SMOOTH);
        gl.glDisable(GL.GL_BLEND);
        gl.glEnable(GL2.GL_LIGHTING);
        gl.glPopAttrib();
    }


    private void drawBoundingBox(GL2 gl) {
        gl.glPushAttrib(GL2.GL_CURRENT_BIT);
        gl.glDisable(GL2.GL_LIGHTING);
        gl.glColor4d(1.0, 1.0, 1.0, 1.0);
        gl.glLineWidth(1.5f);
        gl.glEnable(GL.GL_LINE_SMOOTH);
        gl.glHint(GL.GL_LINE_SMOOTH_HINT, GL.GL_NICEST);
        gl.glEnable(GL.GL_BLEND);
        gl.glBlendFunc(GL.GL_SRC_ALPHA, GL.GL_ONE_MINUS_SRC_ALPHA);

        gl.glBegin(GL.GL_LINE_LOOP);
        gl.glVertex3d(-volume.getDimX() / 2.0, -volume.getDimY() / 2.0, volume.getDimZ() / 2.0);
        gl.glVertex3d(-volume.getDimX() / 2.0, volume.getDimY() / 2.0, volume.getDimZ() / 2.0);
        gl.glVertex3d(volume.getDimX() / 2.0, volume.getDimY() / 2.0, volume.getDimZ() / 2.0);
        gl.glVertex3d(volume.getDimX() / 2.0, -volume.getDimY() / 2.0, volume.getDimZ() / 2.0);
        gl.glEnd();

        gl.glBegin(GL.GL_LINE_LOOP);
        gl.glVertex3d(-volume.getDimX() / 2.0, -volume.getDimY() / 2.0, -volume.getDimZ() / 2.0);
        gl.glVertex3d(-volume.getDimX() / 2.0, volume.getDimY() / 2.0, -volume.getDimZ() / 2.0);
        gl.glVertex3d(volume.getDimX() / 2.0, volume.getDimY() / 2.0, -volume.getDimZ() / 2.0);
        gl.glVertex3d(volume.getDimX() / 2.0, -volume.getDimY() / 2.0, -volume.getDimZ() / 2.0);
        gl.glEnd();

        gl.glBegin(GL.GL_LINE_LOOP);
        gl.glVertex3d(volume.getDimX() / 2.0, -volume.getDimY() / 2.0, -volume.getDimZ() / 2.0);
        gl.glVertex3d(volume.getDimX() / 2.0, -volume.getDimY() / 2.0, volume.getDimZ() / 2.0);
        gl.glVertex3d(volume.getDimX() / 2.0, volume.getDimY() / 2.0, volume.getDimZ() / 2.0);
        gl.glVertex3d(volume.getDimX() / 2.0, volume.getDimY() / 2.0, -volume.getDimZ() / 2.0);
        gl.glEnd();

        gl.glBegin(GL.GL_LINE_LOOP);
        gl.glVertex3d(-volume.getDimX() / 2.0, -volume.getDimY() / 2.0, -volume.getDimZ() / 2.0);
        gl.glVertex3d(-volume.getDimX() / 2.0, -volume.getDimY() / 2.0, volume.getDimZ() / 2.0);
        gl.glVertex3d(-volume.getDimX() / 2.0, volume.getDimY() / 2.0, volume.getDimZ() / 2.0);
        gl.glVertex3d(-volume.getDimX() / 2.0, volume.getDimY() / 2.0, -volume.getDimZ() / 2.0);
        gl.glEnd();

        gl.glBegin(GL.GL_LINE_LOOP);
        gl.glVertex3d(-volume.getDimX() / 2.0, volume.getDimY() / 2.0, -volume.getDimZ() / 2.0);
        gl.glVertex3d(-volume.getDimX() / 2.0, volume.getDimY() / 2.0, volume.getDimZ() / 2.0);
        gl.glVertex3d(volume.getDimX() / 2.0, volume.getDimY() / 2.0, volume.getDimZ() / 2.0);
        gl.glVertex3d(volume.getDimX() / 2.0, volume.getDimY() / 2.0, -volume.getDimZ() / 2.0);
        gl.glEnd();

        gl.glBegin(GL.GL_LINE_LOOP);
        gl.glVertex3d(-volume.getDimX() / 2.0, -volume.getDimY() / 2.0, -volume.getDimZ() / 2.0);
        gl.glVertex3d(-volume.getDimX() / 2.0, -volume.getDimY() / 2.0, volume.getDimZ() / 2.0);
        gl.glVertex3d(volume.getDimX() / 2.0, -volume.getDimY() / 2.0, volume.getDimZ() / 2.0);
        gl.glVertex3d(volume.getDimX() / 2.0, -volume.getDimY() / 2.0, -volume.getDimZ() / 2.0);
        gl.glEnd();

        gl.glDisable(GL.GL_LINE_SMOOTH);
        gl.glDisable(GL.GL_BLEND);
        gl.glEnable(GL2.GL_LIGHTING);
        gl.glPopAttrib();

    }

    @Override
    public void visualize(GL2 gl) 
    {
        if (volume == null) {
            return;
        }

        drawBoundingBox(gl);
       
        // DEBUG Only
        //drawDebug(gl);

        gl.glGetDoublev(GL2.GL_MODELVIEW_MATRIX, viewMatrix, 0);

        long startTime = System.currentTimeMillis();
        
        // create image
        createImage(viewMatrix);
        
        long endTime = System.currentTimeMillis();
        double runningTime = (endTime - startTime);
        panel.setSpeedLabel(Double.toString(runningTime));

        Texture texture = AWTTextureIO.newTexture(gl.getGLProfile(), image, false);

        gl.glPushAttrib(GL2.GL_LIGHTING_BIT);
        gl.glDisable(GL2.GL_LIGHTING);
        gl.glEnable(GL.GL_BLEND);
        gl.glBlendFunc(GL.GL_SRC_ALPHA, GL.GL_ONE_MINUS_SRC_ALPHA);

        // draw rendered image as a billboard texture
        texture.enable(gl);
        texture.bind(gl);
        double halfWidth = image.getWidth() / 2.0;
        gl.glPushMatrix();
        gl.glLoadIdentity();
        gl.glBegin(GL2.GL_QUADS);
        gl.glColor4f(1.0f, 1.0f, 1.0f, 1.0f);
        gl.glTexCoord2d(0.0, 0.0);
        gl.glVertex3d(-halfWidth, -halfWidth, 0.0);
        gl.glTexCoord2d(0.0, 1.0);
        gl.glVertex3d(-halfWidth, halfWidth, 0.0);
        gl.glTexCoord2d(1.0, 1.0);
        gl.glVertex3d(halfWidth, halfWidth, 0.0);
        gl.glTexCoord2d(1.0, 0.0);
        gl.glVertex3d(halfWidth, -halfWidth, 0.0);
        gl.glEnd();
        texture.disable(gl);
        texture.destroy(gl);
        gl.glPopMatrix();

        gl.glPopAttrib();


        if (gl.glGetError() > 0) {
            System.out.println("some OpenGL error: " + gl.glGetError());
        }

    }
    private BufferedImage image;
    private double[] viewMatrix = new double[4 * 4];

    @Override
    public void changed() {
        firstViewVec = null;
        for (int i=0; i < listeners.size(); i++) {
            listeners.get(i).changed();
        }
    }
}

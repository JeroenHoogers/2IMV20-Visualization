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
        TRANSFER2D
    }
    
    private RenderMode renderMode = RenderMode.SLICE;
    private Volume volume = null;
    private GradientVolume gradients = null;
    private double[] firstViewVec = null;
    private int rotSamples = 15;
    private int staticSamples = 120;
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
    
    short getVoxel(double[] coord) 
    {
        if (coord[0] < 0 || Math.ceil(coord[0]) >= volume.getDimX() || coord[1] < 0 || Math.ceil(coord[1]) >= volume.getDimY()
                || coord[2] < 0 || Math.ceil(coord[2]) >= volume.getDimZ()) {
            return 0;
        }

        // Take floor and ceil values
        int xF = (int) Math.floor(coord[0]);
        int xC = (int) Math.ceil(coord[0]);
        
        double alpha = (coord[0] - xF) / (xC - xF);
        
        int yF = (int) Math.floor(coord[1]);
        int yC = (int) Math.ceil(coord[1]);
        
        double beta = (coord[1] - yF) / (yC - yF);
        
        int zF = (int) Math.floor(coord[2]);
        int zC = (int) Math.ceil(coord[2]);
        
        double gamma = (coord[2] - zF) / (zC - zF);
       
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


    void maximalIntenstityProjection(double[] viewMatrix, boolean average) 
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
        
        // get smallest dimention 
        double minDim = Math.max(Math.max(volume.getDimX(), volume.getDimY()), volume.getDimZ());      
        minDim *= 0.5;
        
        if(firstViewVec == null)
        {
            firstViewVec = viewVec;
            VectorMath.normalizeVector(firstViewVec);
            VectorMath.scaleVector(firstViewVec, minDim); 
        }
        
        double[] q0 = viewVec;
        VectorMath.normalizeVector(q0);
        VectorMath.scaleVector(q0, minDim);
    
        double[] q1 = new double[3];
        VectorMath.setVector(q1, -q0[0], -q0[1], -q0[2]);
        
        
        // image is square
        int imageCenter = image.getWidth() / 2;

        double[] pixelCoord = new double[3];
        double[] volumeCenter = new double[3];
        VectorMath.setVector(volumeCenter, volume.getDimX() / 2 , volume.getDimY() / 2, volume.getDimZ() / 2);

        // sample on a plane through the origin of the volume data
        double max = volume.getMaximum();
        TFColor voxelColor = new TFColor();

        for (int j = 0; j < image.getHeight(); j++) 
        {
            for (int i = 0; i < image.getWidth(); i++) 
            {
                int maxVal = 0;
                int valSum = 0;
                int val = 0;
                
                int k = (interactiveMode) ? rotSamples : staticSamples;
                int nrOfValues = 0;
                
                for(int l = 1; l < k; l++)
                {
                    double[] r = VectorMath.lerp(q0, q1, (double)l/(double)k);

                    pixelCoord[0] = uVec[0] * (i - imageCenter) + vVec[0] * (j - imageCenter) + volumeCenter[0] + r[0];
                    pixelCoord[1] = uVec[1] * (i - imageCenter) + vVec[1] * (j - imageCenter)
                            + volumeCenter[1] + r[1];
                    pixelCoord[2] = uVec[2] * (i - imageCenter) + vVec[2] * (j - imageCenter)
                            + volumeCenter[2] + r[2];

                    val = getVoxel(pixelCoord);
                    valSum += val;
                    
                    maxVal = Math.max(val, maxVal);
                    
                    if(val > 0)
                        nrOfValues++;
                }
                
                if(average && nrOfValues > 0)
                    val = valSum / nrOfValues;
                else
                    val = maxVal;
                // Map the intensity to a grey value by linear scaling
                voxelColor.r = val/max;
                voxelColor.g = voxelColor.r;
                voxelColor.b = voxelColor.r;
                voxelColor.a = val > 0 ? 1.0 : 0.0;  // this makes intensity 0 completely transparent and the rest opaque
                // Alternatively, apply the transfer function to obtain a color
                // voxelColor = tFunc.getColor(val);
                
                // BufferedImage expects a pixel color packed as ARGB in an int
                int c_alpha = voxelColor.a <= 1.0 ? (int) Math.floor(voxelColor.a * 255) : 255;
                int c_red = voxelColor.r <= 1.0 ? (int) Math.floor(voxelColor.r * 255) : 255;
                int c_green = voxelColor.g <= 1.0 ? (int) Math.floor(voxelColor.g * 255) : 255;
                int c_blue = voxelColor.b <= 1.0 ? (int) Math.floor(voxelColor.b * 255) : 255;
                int pixelColor = (c_alpha << 24) | (c_red << 16) | (c_green << 8) | c_blue;
                image.setRGB(i, j, pixelColor);
            }
        }

    }
    
    
    void composition(double[] viewMatrix) 
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
        
        // get smallest dimention 
        double minDim = Math.max(Math.max(volume.getDimX(), volume.getDimY()), volume.getDimZ());      
        minDim *= 0.5;
        
        if(firstViewVec == null)
        {
            firstViewVec = viewVec;
            VectorMath.normalizeVector(firstViewVec);
            VectorMath.scaleVector(firstViewVec, minDim); 
        }
        
        double[] q0 = viewVec;
        VectorMath.normalizeVector(q0);
        VectorMath.scaleVector(q0, minDim);
    
        double[] q1 = new double[3];
        VectorMath.setVector(q1, -q0[0], -q0[1], -q0[2]);
        
        
        // image is square
        int imageCenter = image.getWidth() / 2;

        double[] pixelCoord = new double[3];
        double[] volumeCenter = new double[3];
        VectorMath.setVector(volumeCenter, volume.getDimX() / 2 , volume.getDimY() / 2, volume.getDimZ() / 2);

        // sample on a plane through the origin of the volume data
        double max = volume.getMaximum();
        TFColor voxelColor = new TFColor();
        voxelColor.r = 0.0;
        voxelColor.g = 0.0;
        voxelColor.b = 0.0;
        voxelColor.a = 0.0;
        
        for (int j = 0; j < image.getHeight(); j++) 
        {
            for (int i = 0; i < image.getWidth(); i++) 
            {
                int val = 0;
                
                int k = (interactiveMode) ? rotSamples : staticSamples;
                
                TFColor col;
                TFColor newCol;
                
                for(int l = 1; l < k; l++)
                {
                    double[] r = VectorMath.lerp(q1, q0, (double)l/(double)k);

                    pixelCoord[0] = uVec[0] * (i - imageCenter) + vVec[0] * (j - imageCenter) + volumeCenter[0] + r[0];
                    pixelCoord[1] = uVec[1] * (i - imageCenter) + vVec[1] * (j - imageCenter)
                            + volumeCenter[1] + r[1];
                    pixelCoord[2] = uVec[2] * (i - imageCenter) + vVec[2] * (j - imageCenter)
                            + volumeCenter[2] + r[2];

                    val = getVoxel(pixelCoord);
                    col = tFunc.getColor(val);
                    
                    newCol = new TFColor();
                    newCol.r = col.r * col.a + (1-col.a) * voxelColor.r;
                    newCol.g = col.g * col.a + (1-col.a) * voxelColor.g;
                    newCol.b = col.b * col.a + (1-col.a) * voxelColor.b;
                    voxelColor = newCol;  
                }
             
//                // Map the intensity to a grey value by linear scaling
//                voxelColor.r = val/max;
//                voxelColor.g = voxelColor.r;
//                voxelColor.b = voxelColor.r;
                //voxelColor.a = val > 0 ? 1.0 : 0.0;  // this makes intensity 0 completely transparent and the rest opaque
                // Alternatively, apply the transfer function to obtain a color
                  
                
                
                // BufferedImage expects a pixel color packed as ARGB in an int
                int c_alpha = voxelColor.a <= 1.0 ? (int) Math.floor(voxelColor.a * 255) : 255;
                int c_red = voxelColor.r <= 1.0 ? (int) Math.floor(voxelColor.r * 255) : 255;
                int c_green = voxelColor.g <= 1.0 ? (int) Math.floor(voxelColor.g * 255) : 255;
                int c_blue = voxelColor.b <= 1.0 ? (int) Math.floor(voxelColor.b * 255) : 255;
                int pixelColor = (c_alpha << 24) | (c_red << 16) | (c_green << 8) | c_blue;
                image.setRGB(i, j, pixelColor);
            }
        }

    }
    
    void slicer(double[] viewMatrix) 
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

        // image is square
        int imageCenter = image.getWidth() / 2;

        double[] pixelCoord = new double[3];
        double[] volumeCenter = new double[3];
        VectorMath.setVector(volumeCenter, volume.getDimX() / 2, volume.getDimY() / 2, volume.getDimZ() / 2);

        // sample on a plane through the origin of the volume data
        double max = volume.getMaximum();
        TFColor voxelColor = new TFColor();

        for (int j = 0; j < image.getHeight(); j++) {
            for (int i = 0; i < image.getWidth(); i++) {
                pixelCoord[0] = uVec[0] * (i - imageCenter) + vVec[0] * (j - imageCenter)
                        + volumeCenter[0];
                pixelCoord[1] = uVec[1] * (i - imageCenter) + vVec[1] * (j - imageCenter)
                        + volumeCenter[1];
                pixelCoord[2] = uVec[2] * (i - imageCenter) + vVec[2] * (j - imageCenter)
                        + volumeCenter[2];

                int val = getVoxel(pixelCoord);
                
                // Map the intensity to a grey value by linear scaling
                voxelColor.r = val/max;
                voxelColor.g = voxelColor.r;
                voxelColor.b = voxelColor.r;
                voxelColor.a = val > 0 ? 1.0 : 0.0;  // this makes intensity 0 completely transparent and the rest opaque
                // Alternatively, apply the transfer function to obtain a color
                // voxelColor = tFunc.getColor(val);
                
                
                // BufferedImage expects a pixel color packed as ARGB in an int
                int c_alpha = voxelColor.a <= 1.0 ? (int) Math.floor(voxelColor.a * 255) : 255;
                int c_red = voxelColor.r <= 1.0 ? (int) Math.floor(voxelColor.r * 255) : 255;
                int c_green = voxelColor.g <= 1.0 ? (int) Math.floor(voxelColor.g * 255) : 255;
                int c_blue = voxelColor.b <= 1.0 ? (int) Math.floor(voxelColor.b * 255) : 255;
                int pixelColor = (c_alpha << 24) | (c_red << 16) | (c_green << 8) | c_blue;
                image.setRGB(i, j, pixelColor);
            }
        }

    }

    
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
            double[] q0 = firstViewVec;
            double[] q1 = new double[3];
            VectorMath.setVector(q1, -firstViewVec[0], -firstViewVec[1], -firstViewVec[2]);
            double[] r = VectorMath.lerp(q0, q1, 0.25);
            
//            gl.glBegin(GL.GL_LINES);
////            gl.glVertex3d(firstViewVec[0] * 400.0 , firstViewVec[1] * 400.0, firstViewVec[2] * 400.0);
////            gl.glVertex3d(-firstViewVec[0] * 400.0, -firstViewVec[1] * 400.0, -firstViewVec[2] * 400.0);
//            gl.glVertex3d(q0[0] , q0[1], q0[2]);
//            gl.glVertex3d(q1[0], q1[1], q1[2]);
//            gl.glEnd();
            
            gl.glPointSize(5.0f);
            gl.glColor4d(1.0, 1.0, 0.4, 1.0);

//            gl.glBegin(GL.GL_POINTS);
//            gl.glVertex3d(q0[0] , q0[1], q0[2]);
//            gl.glVertex3d(q1[0], q1[1], q1[2]);
//            gl.glVertex3d(r[0], r[1], r[2]);
//           // gl.glVertex3d(0,0,0);
//            gl.glEnd();

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
       
        drawDebug(gl);

        gl.glGetDoublev(GL2.GL_MODELVIEW_MATRIX, viewMatrix, 0);

        long startTime = System.currentTimeMillis();
        
        // Support multiple render modes
        switch(renderMode)
        {
            case SLICE:
                slicer(viewMatrix);
                break;
            case MIP:
                maximalIntenstityProjection(viewMatrix, false);
                break;
            case COMPOSITION:
                composition(viewMatrix);
                break;
            default:
                slicer(viewMatrix);
                break;
        }
         
        
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
        for (int i=0; i < listeners.size(); i++) {
            listeners.get(i).changed();
        }
    }
}

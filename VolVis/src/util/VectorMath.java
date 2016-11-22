/*
 * To change this template, choose Tools | Templates
 * and open the template in the editor.
 */
package util;

/**
 *
 * @author michel
 */
public class VectorMath {

    // assign coefficients c0..c2 to vector v
    public static void setVector(double[] v, double c0, double c1, double c2) {
        v[0] = c0;
        v[1] = c1;
        v[2] = c2;
    }

    // scale vector v using scalar s
    public static void scaleVector(double[] v, double s) {
        v[0] *= s;
        v[1] *= s;
        v[2] *= s;
    }
    
    // vector lerp
    public static double[] lerp(double[] v0, double[] v1, double t)
    {
        double[] r = new double[3];
        r[0] = (1-t) * v0[0] + t * v1[0];
        r[1] = (1-t) * v0[1] + t * v1[1];
        r[2] = (1-t) * v0[2] + t * v1[2];
        return r;
    }
    
    // normalize vector v
    public static void normalizeVector(double[] v) 
    {
        double l = length(v);
        v[0] /= l;
        v[1] /= l;
        v[2] /= l;
    }
    
    // compute dotproduct of vectors v and w
    public static double dotproduct(double[] v, double[] w) {
        double r = 0;
        for (int i=0; i<3; i++) {
            r += v[i] * w[i];
        }
        return r;
    }

    // compute distance between vectors v and w
    public static double distance(double[] v, double[] w) {
        double[] tmp = new double[3];
        VectorMath.setVector(tmp, v[0]-w[0], v[1]-w[1], v[2]-w[2]);
        return Math.sqrt(VectorMath.dotproduct(tmp, tmp));
    }

    // compute dotproduct of v and w
    public static double[] crossproduct(double[] v, double[] w, double[] r) {
        r[0] = v[1] * w[2] - v[2] * w[1];
        r[1] = v[2] * w[0] - v[0] * w[2];
        r[2] = v[0] * w[1] - v[1] * w[0];
        return r;
    }
    
    // compute length of vector v
    public static double length(double[] v) {
        return Math.sqrt(v[0]*v[0] + v[1]*v[1] + v[2]*v[2]);
    }
    

}

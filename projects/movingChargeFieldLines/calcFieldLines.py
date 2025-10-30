import numpy as np
# from charges import Charge
# from field_calculations import MovingChargesField

import scipy.constants as constants
c = constants.c  # set speed of light constant
import json
from abc import ABC, abstractmethod


# Constants
eps = constants.epsilon_0
pi = constants.pi
e = constants.e
c = constants.c
u_0 = constants.mu_0


class Charge(ABC):

    def __init__(self, pos_charge=True):
        self.pos_charge = pos_charge

    @abstractmethod
    def xpos(self, t):
        pass

    @abstractmethod
    def ypos(self, t):
        pass

    @abstractmethod
    def zpos(self, t):
        pass

    @abstractmethod
    def xvel(self, t):
        pass

    @abstractmethod
    def yvel(self, t):
        pass

    @abstractmethod
    def zvel(self, t):
        pass

    @abstractmethod
    def xacc(self, t):
        pass

    @abstractmethod
    def yacc(self, t):
        pass

    @abstractmethod
    def zacc(self, t):
        pass
    
    def xytheta(self, t):
        return np.arctan2(self.yvel(t), self.xvel(t))
    
    def xytheta_dot(self, t):
        derivative = (self.xvel(t)*self.yacc(t) - self.yvel(t)*self.xacc(t)) / (self.xvel(t)**2 + self.yvel(t)**2)
        return np.nan_to_num(derivative)

    def retarded_time(self, tr, t, X, Y, Z):
        """Returns equation to solve for retarded time - Griffiths Eq. 10.55"""
        return ((X-self.xpos(tr))**2 + (Y-self.ypos(tr))**2 + (Z-self.zpos(tr))**2)**0.5 - c*(t-tr)


class Oscillator(Charge):

    def __init__(self, pos_charge=True, center=(0, 0, 0),
                 amplitude=(1e-9, 1e-9), max_speed=0.9*c, phase=0):
        super().__init__(pos_charge)
        self.center = np.array(center)
        self.amplitude = np.array(amplitude)
        self.phase = phase
        # beta_max = beta(t_max), with beta_dot(t_max) = 0
        Ax, Ay = self.amplitude
        self.wt_max = 1/2 * np.arctan2(-Ay**2*np.sin(2*phase), Ax**2 + Ay**2*np.cos(2*phase))
        # print("wtmax", -Ay**2*np.sin(2*phase), Ax**2 + Ay**2*np.cos(2*phase))
        self.w = max_speed / np.sqrt(Ax**2 * np.cos(self.wt_max)**2 + Ay**2 * np.cos(self.wt_max + phase)**2)
        # print("w", self.w)

    def xpos(self, t):
        return self.center[0] + self.amplitude[0]*np.sin(self.w*t)
    
    def ypos(self, t):
        return self.center[1] + self.amplitude[1]*np.sin(self.w*t + self.phase)

    def zpos(self, t):
        return self.center[2] * np.ones(t.shape)
    
    def xvel(self, t):
        return self.w*self.amplitude[0]*np.cos(self.w*t)
    
    def yvel(self, t):
        return self.w*self.amplitude[1]*np.cos(self.w*t + self.phase)
    
    def zvel(self, t):
        return 0 * t

    def xacc(self, t):
        return - self.w**2*self.amplitude[0]*np.sin(self.w*t)

    def yacc(self, t):
        return - self.w**2*self.amplitude[1]*np.sin(self.w*t + self.phase)

    def zacc(self, t):
        return 0 * t

    def get_period(self):
        return 2*np.pi/self.w
    

def calcFieldLines(ti, lgbG, frac_Ax_lim, frac_Ay_lim, Nlines, lgfmax):

    bG = 10**lgbG
    fmax = 10**lgfmax

    Nts = 100
    lim = 1e8  # m
    grid_size = 201  # number of points along x and z direction
    x1d = np.linspace(-lim, lim, grid_size)
    y1d = np.linspace(-lim, lim, grid_size)
    X, Y, Z = np.meshgrid(x1d, y1d, 0, indexing='ij')
    

    beta = np.sqrt(1- 1/(1 + bG**2))
    charge = Oscillator(center=(-lim * 3/4, 0, 0), amplitude=(frac_Ax_lim*lim/4, frac_Ay_lim*lim/4), max_speed= beta*c, phase=0.5*np.pi)
    field = MovingChargesField(charge, h=1e-4)

    ts = np.linspace(0, 2*np.pi/charge.w, Nts)
    # ts = np.arange(0, Nts*dt, dt) # s
    t = ts[ti]
    
    E_total = field.calculate_E(t=t, X=X, Y=Y, Z=Z, pcharge_field='Total', plane=True)
    Eabs = (E_total[0].T**2 + E_total[1].T**2)**0.5

    # print(x1d)
    # print(Eabs.tolist())


    return json.dumps({
        # 2D colormap
        "X": (x1d).tolist(), "Y": (y1d).tolist(), "Z": np.nan_to_num(Eabs).tolist(),
        # trajectory
        "x_charge": [charge.xpos(ts[ti])], "y_charge": [charge.ypos(ts[ti])],
        "x_traj": (charge.xpos(ts)).tolist(), "y_traj": (charge.ypos(ts)).tolist()
        })


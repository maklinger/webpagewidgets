
import numpy as np
from scipy.integrate import simps
from scipy.special import kv
# import physicsConsts as c
import json

def visualiseConvolution(dN_dx, K, Kparams, x_eval, Nfull, xmin, xmax, x_vis_list):
    # full result
    u1D = np.linspace(np.log(xmin), np.log(xmax), Nfull)
    u = u1D[None, :] * np.ones(len(x_eval))[:, None]
    if Kparams:
        y = np.exp(u) * dN_dx(np.exp(u)) * K(np.exp(u)[:, :], x_eval[:, None], *Kparams)
    else:
        y = np.exp(u) * dN_dx(np.exp(u)) * K(np.exp(u)[:, :], x_eval[:, None])
    fullResult = simps(y[:, :], u[:, :], axis=1)
    du = u1D[1] - u1D[0]
    sumResult = du*y #np.sum(du*y, axis=1)

    # representative bins
    vis_list = []
    for x_vis in x_vis_list:
        if Kparams:
            vis_list.append(x_vis*dN_dx(x_vis)*K(x_vis, x_eval, *Kparams))
        else:
            vis_list.append(x_vis*dN_dx(x_vis)*K(x_vis, x_eval))

    return fullResult, sumResult, np.array(vis_list)


def Kernel_Syn(E_electron, E_photon, B):
    '''pitch angle averaged spectral synchrotron term'''
    xc = mec2  * E_photon/(3* B/Bc * E_electron**2)
    constants = 2*np.sqrt(3)/9  * alphaF
    norm = mec2**4 /h
    return constants * norm * Bc/B *E_photon/E_electron**4 * (
        (kv(4/3, xc)*kv(1/3, xc) - 3/5*xc*(kv(4/3, xc)**2 - kv(1/3, xc)**2))
    )

def sbpl(E, N0, E0, p, dp, Eb, s):
    return N0 * (E/E0)**(-p) * (1+ (E/Eb)**(dp*s))**(-1/s)

def Esyn(Eel, B):
    return B/Bc * Eel**2/mec2

def calcSyn(lgEmin, lgEb, lgEmax, p, dp, lgs, lgchi, lgB, lgEelDelta, NvisEl, lgintRes):

    results = {}
    EelDelta = 10** lgEelDelta
    s =10**lgs
    chi = 10**lgchi
    B = 10**lgB
    intRes = 10** lgintRes

    # electron parameters
    Emin = 10**lgEmin * eV2erg
    Eb = 10**lgEb*eV2erg
    Emax = 10**lgEmax * eV2erg
    def Nel(E):
        return sbpl(E, 1, Emin, p, dp, Eb, s) * np.exp(-(E/Emax)**chi) * np.exp(-(Emin/E)**chi)

    # electron plot
    Es = np.logspace(np.max([np.log10(Emin)-1, np.log10(1e6*eV2erg)]), np.log10(Emax)+1, 100) # * eV2erg
    normel = np.max(Es**2 * Nel(Es))
    results["xel"] = list(np.log10(Es*erg2eV))
    results["yel"] =  list(np.log10(Es**2 * Nel(Es) / normel + 1e-10 ))

    
    # synchrotron spectrum
    Eintmin = np.max([1e-1*Emin, mec2])
    Eintmax = 1e2*Emax
    Esynmin = Esyn(Emin, B)
    Esynb = Esyn(Eb, B)
    Esynmax = Esyn(Emax, B)
    Ephs = np.logspace(np.max([np.log10(Esynmin)-5, np.log10(1e-9*eV2erg)]), np.log10(Esynmax)+3, 200) #* eV2erg

    if NvisEl > 1:
        x_vis_list = np.logspace(np.log10(Emin), np.log10(Emax), NvisEl)
    else:
        x_vis_list = [EelDelta*eV2erg]
    Nel_int = np.log10(Eintmax/Eintmin) * intRes

    fullSyn, sumR, vis = visualiseConvolution(
        Nel, Kernel_Syn, [B], Ephs, int(Nel_int), Eintmin, Eintmax, x_vis_list
    )

    # photon plot
    normSyn = np.max(Ephs**(2) * fullSyn)
    results["xphot"] = list(np.log10(Ephs*erg2eV))
    results["yphot"] = list(np.log10(Ephs**(2) * fullSyn / normSyn + 1e-30))
    results["Esynmin"] = np.log10(Esynmin*erg2eV)
    results["Esynb"] = np.log10(Esynb*erg2eV)
    results["Esynmax"] = np.log10(Esynmax*erg2eV)

    results["Eelvis"] = list(np.log10(x_vis_list*erg2eV))
    for i in range(NvisEl):
        results[f"Ephvis_{i}"] = list(np.log10(Ephs**(2) * vis[i] / normSyn + 1e-30))
    
    return json.dumps(results)
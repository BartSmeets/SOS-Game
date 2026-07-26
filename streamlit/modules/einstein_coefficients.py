import numpy as np
from scipy.integrate import solve_ivp
import matplotlib.pyplot as plt

# Constants
h = 4.135667696e-15     # Planck's constant (eV/Hz)
c = 2.99792458e17       # Speed of Light (nm/s)
k = 8.617343e-5    # Boltzmann Constant (eV/K)
min_wave = 380
max_wave = 780
converter = lambda x: h*c/x

def to_html(animation):
    try:
        anim_html = animation.to_jshtml()
    except AttributeError:
        return animation
    ## JS line to find the play button and click on it
    click_on_play = """document.querySelector('.anim-buttons button[title="Play"]').click();"""

    ## Search for the creation of the animation within the jshtml file created by matplotlib
    import re
    pattern = re.compile(r"(setTimeout.*?;)(.*?})", re.MULTILINE | re.DOTALL)

    ## Insert the JS line right below that
    auto_anim = pattern.sub(rf"\1 \n {click_on_play} \2", anim_html)
    return auto_anim

def solve_model(session_state):
    # Compute N0 from
    # N1 + N2 = 1
    # N1/N2 = session_state['ab-N']
    A = np.array([[1, 1],
                [1, -session_state['ab-N']]])
    A_inv = np.linalg.inv(A)
    N0 = A_inv.dot(np.array([1, 0]))

    def differential_equation(t, N, A, BW):
        matrix = np.array([[-BW, (A+BW)],
                        [BW, -(A+BW)]])
        return matrix.dot(N)
    
    # Solve
    t_end = 0.1
    while True:
        t_eval = np.linspace(0, t_end, 100)
        res = solve_ivp(differential_equation, t_span=(0, t_end),t_eval=t_eval, y0=(N0[0], N0[1]), args=(session_state['ab-A'], session_state['ab-BW'])) # First to determine the time domain
        if np.abs(res.y[0][-2]-res.y[0][-1]) < 1e-4:
            break
        else:
            t_end *= 2
    N = [res.y[0][-1], res.y[1][-1]]    # steady state
    return res, N

def figure(res, session_state):
    fig, (ax1, ax2) = plt.subplots(1, 2)
    ax1.plot(res.t, res.y[0]*100, label='$N_1$')
    ax1.plot(res.t, res.y[1]*100, label='$N_2$')
    ax2.plot(res.t, session_state['ab-BW']*(res.y[1] - res.y[0]))

    ax1.set_xlabel('Time (s)')
    ax2.set_xlabel('Time (s)')
    ax1.set_ylabel('Relative Electron Density (%)')
    ax2.set_ylabel('Gain (s$^{-1}$)')
    ax1.legend()
    plt.tight_layout()
    return fig

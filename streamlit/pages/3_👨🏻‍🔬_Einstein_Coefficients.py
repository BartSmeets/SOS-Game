import streamlit as st
import numpy as np
from scipy.integrate import solve_ivp
from matplotlib import animation
import matplotlib.pyplot as plt
import streamlit.components.v1 as components
from streamlit.modules.einstein_coefficients import to_html, solve_model, figure

st.set_page_config(
        page_title="Summer of Science",
        page_icon="☀️")
st.title("Einstein's A & B Coefficients")
st.info('''
        Discover how the A & B coefficients affect the electron populations, N$_1$ and N$_2$. \\
        Can you make a stable possitive gain?
        ''')


# Constants
h = 4.135667696e-15     # Planck's constant (eV/Hz)
h_Si = 6.62607015e-34     # Planck's constant (eV/Hz)
c = 2.99792458e17       # Speed of Light (nm/s)
k = 8.617343e-5    # Boltzmann Constant (eV/K)
min_wave = 380
max_wave = 780
converter = lambda x: h*c/x
pressed = False

# Initialise session state
if 'ab-A' not in st.session_state:
    st.session_state['ab-A']  = 1
if 'ab-BW' not in st.session_state:
    st.session_state['ab-BW'] = 0
if 'ab-T' not in st.session_state:
    st.session_state['ab-T'] = 300
if 'ab-wavelength' not in st.session_state:
    st.session_state['ab-wavelength'] = 532
if 'ab-anim' not in st.session_state:
    st.session_state['ab-anim'] = '<div style = "height=1000px;"></div>'
if 'ab-realistic' not in st.session_state:
    st.session_state['ab-realistic'] = True
if 'ab-N' not in st.session_state:
    st.session_state['ab-N'] = 1

col1, col2 = st.columns(2)
with col1:
    with st.container(border=True):
        st.header('Inputs')
        st.number_input('A$_{21}$ (s$^{-1}$)', min_value=0.01, key='ab-A')
        st.number_input(r'$B_{12}W = B_{21}W$ (s$^{-1}$)', min_value=0., key='ab-BW')
        st.number_input('Wavelength (nm)', min_value=10, max_value=10000, key='ab-wavelength')
        st.number_input('Temperature (K)', min_value=4, key='ab-T')
        X = st.slider('$N_{2}$ (%) (default = 0 %)', min_value=0, max_value=100, value=0)
        try:
            st.session_state['ab-N'] = (100-X)/X
        except ZeroDivisionError:
            st.session_state['ab-N'] = np.exp(h*c/st.session_state['ab-wavelength']/(k*st.session_state['ab-T']))
            
with col2:
    st.image('docs/A&B.png', width=350)
    st.latex(r"""\begin{cases}
         \frac{dN_1}{dt} = -B_{12}WN_{1} + A_{21}N_{2} + B_{21}WN_{2} \\
         \frac{dN_2}{dt} = +B_{12}WN_{1} - A_{21}N_{2} - B_{21}WN_{2}
         \end{cases}""")
    with st.container(border= True):
        st.header('Steady State')
        res, N = solve_model(st.session_state)
        gain = st.session_state['ab-BW']*(N[1]-N[0])        
        st.write('$N_1$ = {} %'.format(round(N[0]/np.sum(N)*100, 1)))
        st.write('$N_2$ = {} %'.format(round(N[1]/np.sum(N)*100, 1)))
        st.write('Gain = %.1f s$^{-1}$' %gain)


fig = figure(res, st.session_state)
st.pyplot(fig)
            
            
        



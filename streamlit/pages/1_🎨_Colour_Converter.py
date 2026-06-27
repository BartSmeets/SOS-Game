import streamlit as st
import streamlit.components.v1 as components
from streamlit.modules.colour_converter import wave2rgb
import matplotlib.colors as colours
import matplotlib.pyplot as plt
import numpy as np

st.set_page_config(
        page_title="Summer of Science",
        page_icon="☀️")

# Constants
h = 4.135667696e-15     # Planck's constant (eV/Hz)
c = 2.99792458e17       # Speed of Light (nm/s)
min_wave = 380
max_wave = 780
converter = lambda x: h*c/x

# Initialise session state
if 'cc-wavelength' not in st.session_state:
    st.session_state['cc-wavelength']  = min_wave
if 'cc-energy' not in st.session_state:
    st.session_state['cc-energy'] = converter(min_wave)

# Define callbacks
def callback1():
    wavelength = st.session_state['cc-wavelength']
    st.session_state['cc-energy'] = converter(wavelength)
def callback2():
    energy = st.session_state['cc-energy']
    st.session_state['cc-wavelength'] = converter(energy)

# Dashboard
st.title('Colour Converter')
st.info('''Play with the representation of the light quantum. \\
        What energy corresponds to a wavelength of 532 nm; and what colour? \\
        What wavelength corresponds to an energy of 2.80 eV; and what colour?        
        ''')
col1, col2 = st.columns(2)
with col1:
    with st.container(height=350):
        st.header('Input')
        st.slider('Wavelength (nm)', min_wave, max_wave, key='cc-wavelength', on_change=callback1)
        st.slider('Energy (eV)', converter(min_wave), converter(max_wave), key='cc-energy', on_change=callback2)
with col2:
    with st.container(height=350):
        hex = colours.to_hex(wave2rgb(st.session_state['cc-wavelength']))
        st.header('Representation')
        def wave(x, wavelength):
            packet = np.exp(-x**2/(2*1000**2))
            omega = 2*np.pi/wavelength
            return packet*np.sin(omega*x)

        
        figure = plt.figure()
        x_plot = np.linspace(-3000, 3000, int(1e6))

        plt.plot(x_plot, wave(x_plot, st.session_state['cc-wavelength']), c=hex, linewidth=5)
        plt.axis('off')
        st.pyplot(figure, use_container_width=True)

with st.container(border=True):
    st.header('Infobox')
    st.write("\
             * " + r"$E = \frac{hc}{\lambda}$, \
                where $\lambda$ is the wavelength; \
                $h = 6.62607015\cdot 10^{-34}$ m$^2$kg/s is Planck's constant; \
                and $c = 2.99792458 \cdot 10^{8}$ m/s is the speed of light.")

        

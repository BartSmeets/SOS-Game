import streamlit as st
import numpy as np
import matplotlib.pyplot as plt

st.set_page_config(
        page_title="Summer of Science",
        page_icon="☀️")

# Constants
h = 6.62607015e-34     # Planck's constant (J/s)
c = 2.99792458e8       # Speed of Light (m/s)
k = 1.380649e-23    # Boltzmann Constant (J/K)
converter = lambda x: h*c/x
Si_bandgap = 1.14   # eV

# Initialise session state
if 'bb-T' not in st.session_state:
    st.session_state['bb-T'] = 300

# Define callbacks
def Planck(wavelength, T):
    wavelength = wavelength * 1e-9
    pre_factor = (8*np.pi*h*c)/(wavelength**5)
    boltzmann_factor = (np.exp((h*c/wavelength)/(k*T)) - 1)
    return pre_factor/boltzmann_factor * 1e-9


st.title('Black Body Radiation')
st.info('''
        Play with Planck's radiation law. \\
        Assuming the Sun is a black body, how hot is the exterior of the Sun?
        ''')

# Dashboard
col1, col2 = st.columns(2)
with col1:
    height = 175
    with st.container(height=height):
        st.header('Input')
        st.number_input('Temperature (K)', min_value=4, max_value=10000, key='bb-T')
        wavelength = np.linspace(200, 1500, 5000)
        spectrum = Planck(wavelength, st.session_state['bb-T'])
        if st.session_state['bb-T'] >= 2000:
            wave_max = wavelength[np.argmax(spectrum)]
        else:
            wave_max = 'Out of Range'
        

with col2:
    with st.container(height=height):
        st.header('Output')
        try:
            st.write('λ$_{max}$ = %.d nm' % wave_max)
        except TypeError:
            st.write('λ$_{max}$ = Out of Range')


fig = plt.figure()

if st.session_state['bb-T'] >= 2000:
    plt.axvline(wave_max, c='grey', ls=':')
plt.plot(wavelength, spectrum)
plt.xticks(np.arange(200, 1501, 100), minor=True)
plt.axvline(380, c='violet', alpha=0.5)
plt.axvline(740, c='red', alpha=0.5)
plt.xlabel('Wavelength (nm)')
plt.ylabel(r'Spectral Energy Density (W / (m$^2 \cdot$nm))')

st.pyplot(fig)





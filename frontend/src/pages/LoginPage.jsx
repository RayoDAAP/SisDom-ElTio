/**
 * @module LoginPage
 * @description Vista del formulario de login.
 */
import useLoginController from '../controllers/authController';

const LoginPage = () => {
  const { formData, isSubmitting, errorMessage, handleChange, handleSubmit } =
    useLoginController();

  return (
    <main className="login-page">
      <div className="login-card">

        {/* Logo */}
        <div className="login-logo">
          <div className="login-logo__oval">
            <span className="login-logo__top">TACOS</span>
            <span className="login-logo__name">&ldquo;EL TÍO&rdquo;</span>
            <span className="login-logo__bottom">BARBACOA Y MENUDO</span>
          </div>
        </div>

        {/* Formulario */}
        <form className="login-form" onSubmit={handleSubmit} noValidate>
          {errorMessage && (
            <p className="login-form__error">{errorMessage}</p>
          )}

          <div>
            <label className="login-form__label" htmlFor="email">
              Correo electrónico
            </label>
            <input
              id="email"
              className="login-form__input"
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="correo@ejemplo.com"
              autoComplete="email"
              required
            />
          </div>

          <div>
            <label className="login-form__label" htmlFor="password">
              Contraseña
            </label>
            <input
              id="password"
              className="login-form__input"
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="••••••••"
              autoComplete="current-password"
              required
            />
          </div>

          <button
            id="login-submit"
            type="submit"
            className="login-form__btn"
            disabled={isSubmitting}
          >
            {isSubmitting
              ? <span className="login-form__spinner" />
              : 'Iniciar sesión'}
          </button>
        </form>

      </div>
    </main>
  );
};

export default LoginPage;
